import API from '@callofduty/api'
import { MW } from '@callofduty/types'
import { Route } from '@stagg/api'
import {
    Put,
    Post,
    Body,
    Res,
    Get,
    Param,
    Query,
    Controller,
    BadRequestException,
} from '@nestjs/common'
import { AccountCredentialsDTO } from './dto'
import { FilterUrlQuery } from './filters'
import { CallOfDutyDB, CallOfDutyAPI } from './services'
import { AccountService } from 'src/account/services'
import { signJwt } from 'src/jwt'
import { denormalizeAccount } from 'src/account/model'
import { denormalizeWzMatch, denormalizeWzMatchRaw } from './model'
import { config } from 'src/config'
import { wzRank } from './rank'

@Controller('/callofduty')
export class CallOfDutyController {
    constructor(
        private readonly acctService: AccountService,
        private readonly codDbService: CallOfDutyDB,
        private readonly codApiService: CallOfDutyAPI,
    ) {}

    @Post('/authorize')
    async ExchangeCredentials(@Res() res, @Body() { email, password }: AccountCredentialsDTO):Promise<Route.CallOfDuty.Authorization> {
        const tokens = await this.codApiService.authorizeCredentials(email, password)
        const { games, profiles: [ profile ] } = await this.codApiService.fetchIdentity(tokens)
        res.setHeader('Access-Control-Expose-Headers', 'X-Authorization-JWT, X-CallOfDuty-Provision-JWT')
        const responsePayload:Route.CallOfDuty.Authorization = {
            account: null,
            accountProvision: null,
            authorizationProvision: tokens
        }
        const existingAcct = await this.acctService.getByPlatformId(profile)
        if (existingAcct) {
            responsePayload.account = denormalizeAccount(existingAcct)
            res.setHeader('X-Authorization-JWT', signJwt(responsePayload))
        } else {
            const profiles = await this.codApiService.fetchAccounts(tokens, profile)
            responsePayload.accountProvision = { games, profiles }
            try {
                const { unoId } = await this.codApiService.fetchUnoId(tokens, profiles[0])
                responsePayload.accountProvision.unoId = unoId
            } catch(e) {}
            res.setHeader('X-CallOfDuty-Provision-JWT', signJwt(responsePayload))
        }
        res.send(responsePayload)
        return responsePayload
    }
    
    @Put('/id/:unoId/wz/matches/:matchId/sus')
    async FlagSuspectWZ(@Param() { unoId, matchId }, @Body() { uno, reasons }) {
        await this.codDbService.saveSus({ uno_id: unoId, uno_username: uno, match_id: matchId, reasons, combined_id: `${unoId}.${matchId}` })
        return { success: true }
    }
    
    @Get('/:platform/:identifier')
    async FetchAccount(@Param() { platform, identifier }) {
        const account = await this.acctService.findAny(platform, identifier)
        if (!account) {
            throw new BadRequestException(`invalid profile ${platform}/${identifier}`)
        }
        return { account: denormalizeAccount(account) }
    }
    
    @Get('/:platform/:identifier/wz')
    async FetchAggregateMatchDataWZ(@Param() { platform, identifier }, @Query() query:FilterUrlQuery) {
        const account = await this.acctService.findAny(platform, identifier)
        if (!account) {
            throw new BadRequestException(`invalid profile ${platform}/${identifier}`)
        }
        const { rank, results } = await this.codDbService.wzAggregateMatchData(account.account_id, query)
        return { rank, account: denormalizeAccount(account), results }
    }
    
    @Get('/:platform/:identifier/wz/matches')
    async FetchMatchHistoryDataWZ(@Param() { platform, identifier }, @Query() query:FilterUrlQuery) {
        const account = await this.acctService.findAny(platform, identifier)
        if (!account) {
            throw new BadRequestException(`invalid profile ${platform}/${identifier}`)
        }
        const { rank, results } = await this.codDbService.wzMatchHistoryData(account.account_id, query)
        return { rank, account: denormalizeAccount(account), results }
    }
    
    @Get('/:platform/:identifier/wz/matches/:matchId')
    async FetchMatchDetailsWZ(@Param() { platform, identifier, matchId }) {
        const account = await this.acctService.findAny(platform, identifier)
        if (!account) {
            throw new BadRequestException(`invalid profile ${platform}/${identifier}`)
        }
        const matchRecord = await this.codDbService.getMatchRecord(account.account_id, matchId)
        if (!matchRecord) {
            throw new BadRequestException(`invalid matchId ${matchId}`)
        }
        // Build team report
        const api = new API()
        const team = []
        const matchDetails = await api.MatchDetails(matchId, 'wz', 'mw')
        for(const r of matchDetails.allPlayers as MW.Match.WZ[]) {
            if (r.player.team === matchRecord.team_id) {
                const results = denormalizeWzMatchRaw(r)
                const teamMemberRecord = { rank: wzRank(1, results.score, results.kills, results.deaths), results }
                const account = await this.acctService.findAny('id', r.player.uno)
                if (account) {
                    teamMemberRecord['account'] = denormalizeAccount(account)
                } else {
                    // Fetch full uno username
                    const botAPI = new API(config.callofduty.bot.auth)
                    await botAPI.FriendAction(r.player.uno, 'invite')
                    const friends = await botAPI.Friends()
                    for(const inv of friends.outgoingInvitations) {
                      if (inv.accountId === r.player.uno) {
                        teamMemberRecord['player'] = { id: r.player.uno, uno: inv.username }
                      }
                    }
                    await botAPI.FriendAction(r.player.uno, 'uninvite')
                    await botAPI.FriendAction(r.player.uno, 'remove')
                }
                team.push(teamMemberRecord)
            }
        }
        return {
            rank: wzRank(1, matchRecord.stat_score, matchRecord.stat_kills, matchRecord.stat_deaths),
            account: denormalizeAccount(account),
            results: denormalizeWzMatch(matchRecord),
            team,
        }
    }
    
}
