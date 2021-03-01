import {
    Get,
    Put,
    Post,
    Param,
    Controller,
    BadRequestException,
} from '@nestjs/common'
import { BotService } from './services'
import { CallOfDutyDB } from 'src/callofduty/services'
import { AccountService } from 'src/account/services'

@Controller('/bot')
export class BotController {
    constructor(
        private readonly botService:BotService,
        private readonly codService:CallOfDutyDB,
        private readonly acctService:AccountService,
    ) {}
    @Get('/health')
    async HealthCheck():Promise<{ rss:number, heapTotal:number, heapUsed:number }> {
        return process.memoryUsage()
    }
    @Post('/message')
    async SendMessage():Promise<{ rss:number, heapTotal:number, heapUsed:number }> {
        return process.memoryUsage()
    }
    @Put('/user/:discordId/wz/role/assign')
    async AssignRole(@Param() { discordId }):Promise<{ success: Boolean }> {
        const account = await this.acctService.findAny('discord', discordId)
        if (!account) {
            throw new BadRequestException('invalid discord user id')
        }
        const { rank } = await this.codService.wzAggregateMatchData(account.account_id, { limit: '7d' })
        const [ rankTierName ] = rank.label.split(' ')
        const guildsWithRolePerms = this.botService.client.guilds.cache.filter(g => {
            console.log('Checking guild', g.name, 'for role permissions...')
            if (!g.me.hasPermission('MANAGE_ROLES')) return false
            console.log('Checking guild', g.name, 'for member...', g.members.cache.array())
            // const m = await g.members.fetch(discordId)
            if (!g.members.cache.find(m => m.id === discordId)) return false
            return true
        }).array()
        console.log('Found guilds with member and perms:', guildsWithRolePerms.map(g => g.name))
        for(const g of guildsWithRolePerms) {
            const roleMap = await this.botService.persistRankRoles(g)
            const desiredRole = roleMap[rankTierName]
            console.log('Found desired role for', rankTierName, 'in guild', g.name)
            const targetMember = g.members.cache.find(m => m.id === discordId)
            const targetMemberRankRoles = targetMember.roles.cache.filter(r => Boolean(roleMap[r.name.replace('WZ ', '')]))
            console.log('Found member rank roles:', targetMemberRankRoles.map(r => r.name))
            const undesiredRolesAssigned = targetMemberRankRoles.filter(r => r.id !== desiredRole.id).array()
            for(const undesiredRole of undesiredRolesAssigned) {
                await targetMember.roles.remove(undesiredRole.id)
            }
            const desiredRoleAssigned = targetMemberRankRoles.find(r => r.id === desiredRole.id)
            if (!desiredRoleAssigned) {
                await targetMember.roles.add(desiredRole.id)
            }
        }
        return { success: true }
    }
}
