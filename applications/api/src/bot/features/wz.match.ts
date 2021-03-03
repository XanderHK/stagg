import { Account } from '@stagg/db'
import { Model, FaaS } from '@stagg/api'
import { config } from 'src/config'
import { MessageHandler, format } from '../handlers/message'
import { Feature } from '.'
import { BotService } from '../services'

export class MatchWZ implements Feature {
    public namespace:string = 'wz last'
    constructor(
        private readonly service:BotService
    ) {}
    public getParams(chain:string[]) {
        const namespaceParams = this.namespace.split(' ').filter(n => n)
        return chain.slice(namespaceParams.length)
    }
    public async onMessage(handler:MessageHandler):Promise<void> {
        let matchId = ''
        let numberOfMatches = 0
        const params = this.getParams(handler.chain)
        for(const i in params) {
            const param = params[i].trim()
            if (param.match(/^[0-9]{1,3}$/)) {
                numberOfMatches = Number(param)
                delete params[i]
                continue
            }
            if (param.match(/^[0-9]{8,}$/)) {
                matchId = param
                delete params[i]
                continue
            }
            if (param === 'me') {
                params[i] = handler.authorAccount.callofduty_uno_username
            }
        }
        if (numberOfMatches > 10) numberOfMatches = 10
        const unoUsernames = [... new Set([...params, ...handler.accounts.map(a => a.callofduty_uno_username)])].filter(str => str)
        if (!unoUsernames.length) {
            unoUsernames.push(handler.authorAccount.callofduty_uno_username)
        }
        const unoUsernameAcctMap = <Record<string, Account.Entity>>{}
        for(const uno of unoUsernames) {
            if (uno === handler.authorAccount.callofduty_uno_username) {
                unoUsernameAcctMap[uno] = handler.authorAccount
                continue
            }
            const taggedAcct = handler.accounts.find(a => a.callofduty_uno_username === uno)
            if (taggedAcct) {
                unoUsernameAcctMap[uno] = taggedAcct
                continue
            }
            unoUsernameAcctMap[uno] = await this.service.acctRepo.findOne({ callofduty_uno_username: uno })
        }
        for(const uno in unoUsernameAcctMap) {
            const acct = unoUsernameAcctMap[uno]
            if (numberOfMatches) {
                const matchIds = await this.getMatchIds(acct.account_id, numberOfMatches)
                for(const matchId of matchIds) {
                    this.dispatchRequest(handler, uno, matchId)
                }
            } else {
                let useMatchId = matchId
                if (!useMatchId) {
                    const [matchId] = await this.getMatchIds(acct.account_id, 1)
                    useMatchId = matchId
                }
                this.dispatchRequest(handler, uno, useMatchId)
            }
        }
    }
    private async getMatchIds(account_id:string, limit:number=1) {
        const records = await this.service.wzRepo.query()
            .select('match_id')
            .where({ account_id })
            .orderBy('start_time', 'DESC')
            .limit(limit).execute()
        return records.map(r => r.match_id)
    }
    private dispatchRequest(handler:MessageHandler, uno:string, matchId:string) {
        console.log('Using matchId:', matchId)
        const renderHtmlFaasUrl = FaaS.Render.HTML.WZ.Match.Details(uno, matchId)
        const cmdWithUsername = `% wz match ${ matchId } ${Model.CallOfDuty.format.username.bot(uno)}`
        const usernameUrl = Model.CallOfDuty.format.username.url.display(uno)
        const profileLinkUrl = config.network.host.web + '/' + usernameUrl + '/matches/' + matchId
        console.log('[>] Discord bot dispatching image from', renderHtmlFaasUrl)
        handler.reply({ content: format(['```', '', cmdWithUsername, '', '```'+profileLinkUrl]), files: [renderHtmlFaasUrl] })
    }
}

export class AliasMatchWZ extends MatchWZ {
    public namespace:string = 'wz match'
}

