import { EventInput, EventHandler } from '.'
import { FaaS, Model, Events } from '@stagg/api'
import { config } from '../config'


export class Created implements EventHandler {
    public readonly eventType:string = Events.Account.Created.Type
    public async callback({ payload: { account } }:EventInput<Events.Account.Payload>):Promise<void> {
        // Kick-off account data ETL
        console.log('[+] Kick-off Account Data ETL for', account.account_id)
        FaaS.ETL.Account(account.account_id, { fresh: true })
        // Send welcome message to user on Discord
        console.log('[+] Send Discord welcome message to', account.discord_id)
        FaaS.Bot.Message({ user: account.discord_id }, config.discord.messages.account.welcome)
    }
}

export class Ready implements EventHandler {
    public readonly eventType:string = Events.Account.Ready.Type
    public async callback({ payload: { account } }:EventInput<Events.Account.Payload>):Promise<void> {
        console.log('[+] Send Discord ready message to', account.discord_id)
        FaaS.Bot.Message({ user: account.discord_id }, config.discord.messages.account.ready)
        // Send alert to public channel on Discord
        console.log('[+] Send Discord welcome alert to', config.discord.channels.public.reporting)
        const botUsername = Model.CallOfDuty.format.username.bot(account.callofduty_uno_username)
        const urlUsername = Model.CallOfDuty.format.username.url.display(account.callofduty_uno_username)
        FaaS.Bot.Message({ channel: config.discord.channels.public.reporting }, [
            `**Welcome <@!${account.discord_id}> aka \`${botUsername}\`!!!** 👋🥳🎉`,
            `${config.network.host.web}/${urlUsername}`,
            '```',
            `% wz ${botUsername} 7d`,
            '```',
        ])
    }
}
