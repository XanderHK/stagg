import * as Discord from 'discord.js'
import { Controller, Get, Param, Res, BadRequestException } from '@nestjs/common'
import { UserService } from 'src/user/services'
import { DiscordService } from 'src/discord/services'
import { Dispatch } from 'src/discord/bot/services.dispatch'
import { DISCORD_INVITE_URL } from 'src/config'

@Controller('/discord')
export class DiscordController {
    constructor(
        private readonly userService: UserService,
        private readonly discordService: DiscordService,
    ) {}
    @Get('/health')
    async HealthCheck():Promise<string> {
        return 'ok'
    }
    @Get('/join')
    async Join(@Res() res):Promise<void> {
        res.redirect(DISCORD_INVITE_URL)
    }
    @Get('/guilds')
    async Guilds():Promise<Discord.Guild[]> {
        return this.discordService.client.guilds.cache.array()
    }
    @Get('/guilds/:guildId')
    async GuildById(@Param() { guildId }):Promise<Discord.Guild> {
        return this.discordService.client.guilds.cache.get(guildId)
    }
    @Get('/guilds/:guildId/owner')
    async GuildOwnerById(@Param() { guildId }):Promise<Discord.GuildMember> {
        return this.discordService.client.guilds.cache.get(guildId).owner
    }
    @Get('/guilds/:guildId/roles')
    async GuildRolesById(@Param() { guildId }):Promise<Discord.Role[]> {
        return this.discordService.client.guilds.cache.get(guildId).roles.cache.array()
    }
    @Get('/guilds/:guildId/members')
    async GuildMembersById(@Param() { guildId }):Promise<Discord.GuildMember[]> {
        return this.discordService.client.guilds.cache.get(guildId).members.cache.array()
    }
    @Get('/cmd/:userId/*')
    async SimulateBotCommand(@Param() params):Promise<Dispatch.Output> {
        const { userId } = params
        delete params.userId
        const user = await this.userService.fetchById(userId)
        if (!user) {
            throw new BadRequestException('user does not exist')
        }
        const [chainSlashed] = Object.values(params) as string[]
        const chain = chainSlashed.split('/')
        return this.discordService.triggerBotCommand(user, ...chain)
    }
}