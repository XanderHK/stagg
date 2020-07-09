import * as Mongo from '@stagg/mongo'
import { Client } from 'discord.js'
import apiCfg from '../config/api'
import uiCfg from '../config/ui'
import { delay } from '../util'

Mongo.Config(apiCfg.mongo)
const discord = new Client()
discord.login(apiCfg.discord.token)

export const profileById = async (id:string) => discord.users.fetch(id)
export const profileByEmail = async (email:string) => {
    const mongo = await Mongo.Client()
    const player = await mongo.collection('players').findOne({ email })
    if (!player) return null
    if (!player.discord) return null
    return profileById(player.discord)
}

export const profile = async (req, res) => {
    const discord = req.query.id ? await profileById(req.query.id) : await profileByEmail(req.query.email)
    res.send({ ...discord })
}

export const server = async (req,res) => {
    let guild
    let attempts = 0
    while(!guild) {
        if (attempts > 10) {
            return res.send({ staff: [], members: [], online: [], error: 'unable to connect to Discord' })
        }
        guild = discord.guilds.resolve(discord.guilds.resolveID(uiCfg.discord.server.id))
        attempts++
        await delay(100)
    }
    const online = []
    const members = []
    const staffMembers = []
    const staffRoleIds = []
    const onlineMemberIds = []
    const staffRoleNames = ['Stagg', '@moderator'] // leaving out @admin for now
    for(const [, role] of guild.roles.cache) {
        if (staffRoleNames.includes(role.name)) {
            staffRoleIds.push(role.id)
        }
    }
    for(const [,presence] of guild.presences.cache) {
        if (presence.status === 'online') {
            onlineMemberIds.push(presence.userID)
        }
    }
    for(const [, member] of guild.members.cache) {
        const memberProps = {
            id: member.user.id,
            bot: member.user.bot,
            username: member.user.username,
            discriminator: member.user.discriminator,
        }
        members.push({ ...memberProps })
        for(const roleId of member._roles) {
            if (staffRoleIds.includes(roleId)) {
                staffMembers.push({ ...memberProps })
            }
        }
        if (onlineMemberIds.includes(memberProps.id)) {
            online.push({ ...memberProps })
        }
    }
    const staff = staffMembers.sort((a,b) => (a.username.length + a.discriminator.length) - (b.username.length + b.discriminator.length))
    res.send({ staff, members, online })
}
