import { API, Model } from '@stagg/api'
import * as Discord from 'discord.js'
import { config } from './config'

let active = false
const client = new Discord.Client()

const connectDiscord = () => new Promise<void>((resolve) => {
    if (active) return resolve()
    client.login(config.discord.client.token)
    client.on('ready', () => (active = true) && resolve())
})

export const runJob = async (discord_id:string, limit:string='7d', skip:string='') => {
    if (!discord_id) {
        console.log('[!] Returning empty, no discord id')
        return
    }
    console.log('[.] Connecting to Discord...')
    await connectDiscord()
    console.log('[.] Connected to Discord...')
    for(const guild of client.guilds.cache.array()) {
        const member = await getGuildMember(guild, discord_id)
        if (!member) {
            continue
        }
        try {
            await persistRoles(guild)
            await assignRole(member, guild, limit, skip)
        } catch(e) {
            console.log('[!] Role assignment failure:', e)
        }
    }
}

async function getGuildMember(guild:Discord.Guild, userId:string) {
    try {
        console.log(`[?] Inspecting guild "${guild.name}" (${guild.id}) for user id ${userId}`)
        const member = await guild.members.fetch({ user: userId })
        return member
        // ^ will throw error if member not found
    } catch(e) {
        return null
    }
}

async function persistRoles(guild:Discord.Guild) {
    const roleMap = {}
    const tierNames = []
    for(const tierName of config.callofduty.wz.ranking.tiers) {
        roleMap[tierName] = null
        tierNames.push(tierName)
    }
    const guildRoles = guild.roles.cache.array()
    const rankRelatedGuildRoles = guildRoles.filter(({ name }) => tierNames.find(t => name.includes(t)))
    for(const role of rankRelatedGuildRoles) {
        const tierName = tierNames.find(tierName => role.name.includes(tierName))
        roleMap[tierName] = role
    }
    const missingRoleTierNames = Object.keys(roleMap).filter(k => !roleMap[k])
    for(const missingRoleTierName of missingRoleTierNames) {
        console.log(`[+] Creating ranked role for ${missingRoleTierName} in "${guild.name}" (${guild.id})...`)
        const tierIndex = config.callofduty.wz.ranking.tiers.indexOf(missingRoleTierName)
        roleMap[missingRoleTierName] = await guild.roles.create({
            data: {
                position: tierIndex + 1,
                name: `WZ ${missingRoleTierName}`,
                color: config.discord.roles.ranking.colors[tierIndex],
            },
            reason: `Missing ranked role for ${missingRoleTierName} tier`
        })

    }
}

async function assignRole(member:Discord.GuildMember, guild:Discord.Guild, limit:string='7d', skip:string='') {
    const filters = Model.CallOfDuty.format.filters.urlToObj({ limit, skip, modesExcluded: 'dmz' })
    const { data: { rank } } = await API.CallOfDuty.WZ.Match.Summary(member.user.id, 'discord', filters)
    console.log('[.] Received rank from API:', rank)
    const guildRoles = guild.roles.cache.array()
    const allTierRoles = guildRoles.filter(({ name }) => config.callofduty.wz.ranking.tiers.find(tier => name.includes(tier)))
    const allTierRoleIds = allTierRoles.map(r => r.id)
    const memberTierRoles = member.roles.cache.filter(r => allTierRoleIds.includes(r.id)).array()
    const memberTierRoleIds = memberTierRoles.map(r => r.id)
    const desiredGuildRole = guild.roles.cache.find(({ name }) => name.includes(config.callofduty.wz.ranking.tiers[rank.tier]))
    if (!memberTierRoleIds.includes(desiredGuildRole.id)) {
        await member.roles.add(desiredGuildRole.id)
    }
    for(const id of memberTierRoleIds) {
        if (id !== desiredGuildRole.id) {
            await member.roles.remove(id)
        }
    }
}
