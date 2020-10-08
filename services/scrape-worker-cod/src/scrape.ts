import { Db, ObjectId } from 'mongodb'
import { delay } from '@stagg/util'
import { API, Schema, Normalize } from '@stagg/callofduty'
import { useClient } from './db'
import { DELAY_SUCCESS, DELAY_FAILURE } from './config'

export interface Ledger {
    _id: ObjectId
    unsaved?: boolean // only on new creations prior to insert
    selected: number
    bo4?: Ledger.Game
    mw?: Ledger.Game
}
export namespace Ledger {
    export interface Game {
        mp: Game.Type
        wz: Game.Type
    }
    export namespace Game {
        export interface Type {
            newest: number
            oldest: number
            updated: number
            failures: number
        }
    }
}

export interface Options {
    gameId: Schema.API.Game
    gameType: Schema.API.GameType
    retry: number // number of retry attempts
    start: number // starting timestamp
    logger(...output:any): any // general information and error output
    delay: {
        success: 100, // wait this long after successful batch fetch
        failure: 500, // wait this long after failed batch fetch
    }
    include?: {
        events?: boolean // true will fetch match map events (extra req per match)
        details?: boolean // true will fetch match map events (extra req per match)
        summary?: boolean // true will fetch isolated summaries (extra req per match)
    }
}

export class Instance {
    private db: Db
    private API: API
    private ledger: Ledger
    private account: Schema.DB.Account
    private options:Options = {
        gameId: 'mw',
        gameType: 'wz',
        retry: 3,
        start: 0,
        logger: console.log,
        delay: {
            success: 100,
            failure: 500,
        },
        include: {
            events: true,
            details: true,
            summary: true,
        },
    }
    constructor(options?:Partial<Options>) {
        if (options) {
            this.options = {
                ...this.options,
                ...options,
            }
        }
    }
    public async ETL(accountId:string) {
        this.options.logger('init')
        this.API = new API()
        this.account = { _id: new ObjectId(accountId) } as any
        await this.InitializeDB()
        await this.InitializeLedger()
        await this.InitializeAccount()
        if (!this.account) {
            throw 'Invalid AccountID'
        }
        if (!this.account.auth) {
            await this.ResolveAuth()
            this.API.Tokens(this.account.auth)
        } else {
            this.API.Tokens(this.account.auth)
            try {
                await this.IdentityETL()
            } catch(e) {
                this.options.logger('[!] Init failure!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                // await this.db.collection('accounts').updateOne({ _id: this.account._id }, { $set: { initFailure: true } })
            }
        }
        if (this.ProfileRouteAvailable) {
            await this.ProfileETL()
        }
        if (!this.Normalizer) {
            throw `unrecognized '${this.options.gameId}.${this.options.gameType}' normalization request`
        }
        await this.MatchETL()
        await this.SyncLedger()
    }
    private get ProfileRouteAvailable():boolean {
        switch(this.options.gameId) {
            case 'mw':
                return true
            default:
                return false
        }
    }
    private get MatchEventsRouteAvailable():boolean {
        if (this.options.gameId === 'mw' && this.options.gameType === 'mp') {
            return true
        }
        return false
    }
    private get Normalizer():{ [key:string]: any } {
        switch(this.options.gameId) {
            case 'mw':
                return Normalize.MW
            default:
                return null
        }
    }
    private get PreferredProfileNoUnoId():{ username: string, platform: Schema.API.Platform } {
        const tmpUnoId = this.account.profiles.id
        delete this.account.profiles.id
        const preferredProfile = this.PreferredProfile
        this.account.profiles.id = tmpUnoId
        return preferredProfile
    }
    private get PreferredProfile():{ username: string, platform: Schema.API.Platform } {
        if (this.account.profiles.id) {
            return { username: this.account.profiles.id, platform: 'uno' }
        }
        if (this.account.profiles.battle) {
            return { username: this.account.profiles.battle, platform: 'battle' }
        }
        if (this.account.profiles.psn) {
            return { username: this.account.profiles.psn, platform: 'psn' }
        }
        if (this.account.profiles.xbl) {
            return { username: this.account.profiles.xbl, platform: 'xbl' }
        }
        if (this.account.profiles.steam) {
            return { username: this.account.profiles.steam, platform: 'steam' }
        }
        return { username: this.account.profiles.uno, platform: 'uno' }
    }
    private async InitializeDB() {
        this.db = await useClient('callofduty')
    }
    private async InitializeLedger() {
        this.ledger = await this.db.collection('_ETL.ledger').findOne({ _id: this.account._id })
        if (!this.ledger) {
            this.ledger = {
                _id: this.account._id,
                unsaved: true,
            } as Ledger
        }
        if (this.ledger.selected) {
            this.options.logger('[<] Ledger previously selected at', this.ledger.selected)
        }
        this.ledger.selected = Date.now()
        if (!this.ledger[this.options.gameId]) {
            this.ledger[this.options.gameId] = {}
        }
        if (!this.ledger[this.options.gameId][this.options.gameType]) {
            this.ledger[this.options.gameId][this.options.gameType] = {
                failures: 0,
                updated: Date.now()
            }
        }
        await this.SyncLedger()
    }
    private async SyncLedger() {
        // Try inserting if it already exists it will fail
        try {
            if (this.ledger.unsaved) {
                delete this.ledger.unsaved
                await this.db.collection('_ETL.ledger').insertOne(this.ledger)
                this.options.logger('[+] Created new ledger...')
            } else {
                throw 'Ledger is already saved, proceeding...'
            }
        } catch(e) {
            // Update instead if inserting failed
            await this.db.collection('_ETL.ledger').updateOne({ _id: this.ledger._id }, { $set: { ...this.ledger } })
            this.options.logger('[^] Updated existing ledger...')
        }
    }
    private async InitializeAccount() {
        console.log('init', this.account._id)
        this.account = await this.db.collection('accounts').findOne({ _id: this.account._id })
    }
    private async ResolveAuth() {
        const [randomAcctWithAuth] = await this.db.collection('accounts').aggregate([
            { $match: { auth: { $exists: true } } },
            { $sample: { size: 1 } }
        ]).toArray()
        this.account.auth = randomAcctWithAuth.auth
    }
    // IdentityETL will only be called if this account has their own auth
    private async IdentityETL() {
        // Fetch identity (usually gives Battle.net ID)
        const { titleIdentities } = await this.API.Identity()
        const profiles:any = {}
        const games:Schema.API.Game[] = []
        for(const identity of titleIdentities) {
            profiles[identity.platform] = identity.username
            if (!games.includes(identity.title)) {
                games.push(identity.title)
            }
        }
        this.account.games = games
        if (!this.account.profiles) {
            this.account.profiles = {} as any
        }
        this.account.profiles = { ...this.account.profiles, ...profiles }
        // We cannot use uno ID for platform identities fetching
        const { username, platform } = this.PreferredProfileNoUnoId
        // Fetch all other profiles given the singular Identity
        const platformProfiles = await this.API.Platforms(username, platform)
        for(const platform in platformProfiles) {
            profiles[platform] = platformProfiles[platform].username
        }
        // Save all profiles and games
        await this.db.collection('accounts').updateOne({ _id: this.account._id }, { $set: { games, profiles: this.account.profiles } })
    }
    private async ProfileETL() {
        if (!this.Normalizer.Profile) {
            throw `profile normalization missing for callofduty.${this.options.gameId}.${this.options.gameType}`
        }
        const { username, platform } = this.PreferredProfileNoUnoId
        const profile = await this.API.Profile(username, platform, this.options.gameType, this.options.gameId)
        const collection = `${this.options.gameId}.${this.options.gameType}.profiles`
        const normalizedProfile = this.Normalizer.Profile(profile, this.account)
        try {
            await this.db.collection(collection).insertOne({
                _id: this.account._id,
                updated: new Date(),
                ...normalizedProfile,
            })
            this.options.logger('[+] Created new profile...')
        } catch(e) {
            this.options.logger('[^] Profile exists, updating...')
            await this.db.collection(collection).updateOne({ _id: this.account._id }, {
                $set: {
                    updated: new Date(),
                    ...normalizedProfile,
                }
            })
        }
    }
    private async MatchETL() {
        try {
            await this.MatchBatchETL()
            await delay(DELAY_SUCCESS)
        } catch(e) {
            await delay(DELAY_FAILURE)
            this.options.logger(`[!] Failure:`, e)
            this.ledger[this.options.gameId][this.options.gameType].failures++
            if (this.ledger[this.options.gameId][this.options.gameType].failures > this.options.retry) {
                this.options.logger('    Retry attempts exceeded, exiting...')
            } else {
                await this.MatchETL()
            }
        }
    }
    private async MatchBatchETL() {
        this.options.logger('[?] Debug investigation: MatchBatchETL')
        const { gameId, gameType, start } = this.options
        const timestamp = start
        const { username, platform } = this.PreferredProfileNoUnoId
        const { matches } = await this.API.MatchList(username, platform, gameType, gameId, timestamp)
        if (!matches?.length) {
            throw 'API returned empty matches...'
        }
        const matchMap:any = {}
        const matchIds:string[] = []
        const matchEndTimes:number[] = []
        const matchStartTimes:number[] = []
        for(const match of matches) {
            matchIds.push(match.matchID)
            matchMap[match.matchID] = match
            matchEndTimes.push(match.utcEndSeconds)
            matchStartTimes.push(match.utcStartSeconds)
        }
        const recordIds = matchIds.map(mid => `${mid}.${String(this.account._id)}`)
        const foundRecords = await this.db.collection(`${gameId}.${gameType}.match.records`)
            .find({ _id: { $in: recordIds } }, { matchId: 1 } as any).toArray()
        const foundRecordMatchIds = foundRecords.map(r => r.matchId)
        for(const matchId of matchIds.filter(mid => !foundRecordMatchIds.includes(mid))) {
            try { await this.MatchRecordETL(matchMap[matchId]) } catch(e) {}
        }
        if (this.options.include?.details) {
            const foundDetails = await this.db.collection(`${gameId}.${gameType}.match.details`)
                .find({ matchId: { $in: matchIds } }, { matchId: 1 } as any).toArray()
            const foundDetailsMatchIds = foundDetails.map(d => d.matchId)
            for(const matchId of matchIds.filter(mid => !foundDetailsMatchIds.includes(mid))) {
                try { await this.MatchDetailsETL(matchMap[matchId]) } catch(e) {}
            }
        }
        if (this.options.include?.events && this.MatchEventsRouteAvailable) {
            const foundEvents = await this.db.collection(`${gameId}.${gameType}.match.events`)
                .find({ matchId: { $in: matchIds } }, { matchId: 1 } as any).toArray()
            const foundEventsMatchIds = foundEvents.map(e => e.matchId)
            for(const matchId of matchIds.filter(mid => !foundEventsMatchIds.includes(mid))) {
                try { await this.MatchEventsETL(matchMap[matchId]) } catch(e) {}
            }
        }
        if (this.options.include?.summary) {
            const foundSummaries = await this.db.collection(`${gameId}.${gameType}.match.records`).find({
                    _account: this.account._id,
                    matchId: { $in: matchIds },
                    'stats.avgLifeTime': { $exists: true },
                }, { matchId: 1 } as any).toArray()
            const foundSummariesMatchIds = foundSummaries.map(s => s.matchId)
            for(const matchId of matchIds.filter(mid => !foundSummariesMatchIds.includes(mid))) {
                try { await this.MatchSummaryETL(matchMap[matchId]) } catch(e) {}
            }
        }
        // Reset failures and updated timestamp
        this.ledger[gameId][gameType].failures = 0
        this.ledger[gameId][gameType].updated = (new Date()).getTime()
        // Update oldest and newest game timestamps
        const [newest] = matchEndTimes.sort((a,b) => b-a)
        const [oldest] = matchStartTimes.sort((a,b) => a-b)
        if (!this.ledger[gameId][gameType].newest || this.ledger[gameId][gameType].newest < newest) {
            this.ledger[gameId][gameType].newest = newest
        }
        if (!this.ledger[gameId][gameType].oldest || this.ledger[gameId][gameType].oldest > oldest) {
            this.ledger[gameId][gameType].oldest = oldest
        }
    }
    private async RecordUnoID(unoId:string) {
        this.account.profiles.id = unoId
        this.options.logger(`[+] Recorded new UnoID ${unoId}`)
        await this.db.collection('accounts').updateOne({ _id: this.account._id }, { $set: { 'profiles.id': unoId } })
    }
    private async MatchRecordETL(match:Schema.API.MW.Match) {
        if (!this.account.profiles.id) {
            await this.RecordUnoID(match.player.uno)
        }
        const normalizedMatch = this.Normalizer.Match.Record(match)
        const collection = `${this.options.gameId}.${this.options.gameType}.match.records`
        await this.db.collection(collection).insertOne({ _id: `${match.matchID}.${String(this.account._id)}`, _account: this.account._id, ...normalizedMatch })
    }
    private async MatchEventsETL(match:Schema.API.MW.Match) {
        this.options.logger(`[>] Requesting match events for ${match.matchID}`)
        // No normalization for these yet, not sure it's really necessary...
        const collection = `${this.options.gameId}.${this.options.gameType}.match.events`
        const events = await this.API.MatchEvents(match.matchID, this.options.gameId)
        await this.db.collection(collection).insertOne({ _id: match.matchID, ...events })
        this.options.logger('    Saved match events for', match.matchID)
    }
    private async MatchDetailsETL(match:Schema.API.MW.Match) {
        this.options.logger(`[>] Requesting match details for ${match.matchID}`)
        const collection = `${this.options.gameId}.${this.options.gameType}.match.details`
        const details = await this.API.MatchDetails(match.matchID, this.options.gameType, this.options.gameId)
        const normalizedDetails = this.Normalizer.Match.Details(details)
        if (!normalizedDetails) {
            this.options.logger(`    Details normalizer missing for ${this.options.gameId}.${this.options.gameType}`)
            throw `normalizer missing for ${this.options.gameId}.${this.options.gameType}`
        }
        await this.db.collection(collection).insertOne({ _id: match.matchID, ...normalizedDetails })
        this.options.logger('    Saved match details for', match.matchID)
    }
    private async MatchSummaryETL(match:Schema.API.MW.Match) {
        this.options.logger(`[>] Requesting isolated match summary for ${match.matchID}`)
        this.options.logger('[?] Debug investigation: MatchSummaryETL')
        const { summary } = await this.API.MatchSummary(match, this.options.gameId)
        if (!summary) {
            this.options.logger('    MatchSummary returned empty')
            throw 'Empty match data for isolated match summary'
        }
        this.options.logger(`    Saving avgLifeTime ${summary.all.avgLifeTime}`)
        const recordId = `${match.matchID}.${String(this.account._id)}`
        const collection = `${this.options.gameId}.${this.options.gameType}.match.records`
        await this.db.collection(collection).updateOne({ _id: recordId }, { $set: { 'stats.avgLifeTime': summary.all.avgLifeTime } })
        this.options.logger(`    Set avgLifeTime ${summary.all.avgLifeTime} for ${recordId}`)
    }
}