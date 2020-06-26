import * as Mongo from '@stagg/mongo'
import { CallOfDuty as CallOfDutyAPI } from '@stagg/api'
export const Match = async (req:Express.Request|any,res:Express.Response|any) => {
    const { matchId } = req.params
    if (!matchId) {
        return res.status(400).send({ error: 'invalid matchId' })
    }
    const mongo = await Mongo.Client()
    const match = await mongo.collection('matches.wz').findOne({ matchId })
    res.status(200).send(match)
}
export const Login = async (req:Express.Request|any,res:Express.Response|any) => {
    try {
        const API = new CallOfDutyAPI()
        const mongo = await Mongo.Client()
        const { email, password } = req.body
        const { xsrf, atkn, sso } = await API.Login(email, password)
        const { titleIdentities } = await API.Tokens({ xsrf, atkn, sso }).Identity()
        const { platform:platformId, username } = titleIdentities.find((i:any) => i.title === 'mw')
        const { tag:platform } = await mongo.collection('platforms').findOne({ api: platformId })
        const player = await Mongo.CallOfDuty.Get.Player(username, platform)
        if (player) {
            player.email = email
            player.api.auth = { xsrf, atkn, sso }
            await mongo.collection('players').updateOne({ _id: player._id }, { $set:{...player} })
            return res.send({ email: player.email, profiles: player.profiles })
        }
        // Player does not exist in DB, create them
        const platformIds = await API.Tokens({ xsrf, atkn, sso }).Platforms(platformId, username)
        const formattedPlatformIds = {} as any
        for(const platformName of Object.keys(platformIds)) {
            formattedPlatformIds[platformName] = platformIds[platformName]?.username
        }
        const profiles = {} as any
        for(const platformName in formattedPlatformIds) {
            const { tag } = await mongo.collection('platforms').findOne({ api: platformName })
            if (tag) {
                profiles[tag] = formattedPlatformIds[platformName]
            }
        }
        await Mongo.CallOfDuty.Put.Player({ email, profiles, api: { auth: { xsrf, atkn, sso } } })
        console.log(`[+] Created player ${platform}<${username}>`)
        res.status(201).send({ email, profiles })
    } catch(error) {
        res.status(500).send({ error })
    }
}
export namespace Profile {
    export const Search = async (req:Express.Request|any,res:Express.Response|any) => {
        const { username } = req.params
        res.send(await ProfileService.Search(username))
    }
    export const Ping = async (req:Express.Request|any,res:Express.Response|any) => {
        const { platform, username } = req.params
        const pingRes = await ProfileService.Ping(username, platform)
        if (pingRes) return res.send(pingRes)
        res.status(404).send({ error: 'user does not exist' }) // player does not exist on cod
    }
    export namespace Warzone {
        export const Diff = async (req:Express.Request|any,res:Express.Response|any) => {
            const { matchIds } = req.body
            const { platform, username } = req.params
            const matchIdsDiff = await Mongo.CallOfDuty.Get.Warzone.MatchIds(username, platform, matchIds)
            res.status(200).send(matchIdsDiff)
        }
    }
}


export namespace ProfileService {
    export const Ping = async (username:string, platform:Mongo.T.CallOfDuty.Platform='ATV') => {
        console.log(`[>] New player data request for ${platform}<${username}>`)
        const player = await Mongo.CallOfDuty.Get.Player(username, platform)
        if (player) {
            const mongo = await Mongo.Client()
            const matches = await mongo.collection('performances.wz').find({ 'player._id': player._id }).count()
            return { platform, username, local: true, matches }
        }
        try {
            const tokens = await Mongo.CallOfDuty.Get.Auth()
            const { api } = await Mongo.CallOfDuty.Get.Platform(platform)
            const API = new CallOfDutyAPI(tokens)
            await API.Profile(username, api as any)
            return { platform, username, local: false, matches: 0 } // player exists on cod
        } catch(e) {
            console.log(`[!] Invalid player ${platform}<${username}>`)
            return false // player does not exist on cod
        }
    }
    export const Search = async (username:string) => {
        const mongo = await Mongo.Client()
        const queries = []
        const platforms = await mongo.collection('platforms').find().toArray()
        for( const { tag } of platforms ) {
            queries.push({ [`profiles.${tag.toUpperCase()}`]: { $regex: username, $options: 'i' } })
        }
        const players = await mongo.collection('players').find({ $or: queries }).toArray()
        return players.map(({ profiles }) => ({ ...profiles }))
    }
}