import { Model, FaaS } from '@stagg/api'
import { config } from 'src/config'
import { MessageHandler, format } from '../handlers/message'
import { Feature } from '.'

export class BarracksWZ implements Feature {
    public namespace:string = 'wz'
    public getParams(chain:string[]) {
        const namespaceParams = this.namespace.split(' ').filter(n => n)
        return chain.slice(namespaceParams.length)
    }
    public async onMessage(handler:MessageHandler):Promise<void> {
        const params = this.getParams(handler.chain)
        const filters = <Model.CallOfDuty.Match.Filters>{ limit: null, skip: null }
        for(const i in params) {
            const param = params[i].trim()
            if (param.match(/^[0-9]{1,3}(d|m)?$/i)) {
                const uom = <Model.CallOfDuty.Match.Filters.UOM>param.replace(/[0-9]/g, '')
                const count = Number(param.replace(/[^0-9]/g, ''))
                filters[filters.limit === null ? 'limit' : 'skip'] = { uom, count }
                delete params[i]
            }
            if (param === 'me') {
                params[i] = handler.authorAccount.callofduty_uno_username
            }
        }
        const unoUsernames = [... new Set([...params, ...handler.accounts.map(a => a.callofduty_uno_username)])].filter(str => str)
        if (!unoUsernames.length) {
            unoUsernames.push(handler.authorAccount.callofduty_uno_username)
        }
        for(const uname of unoUsernames) {
            const renderHtmlFaasUrl = FaaS.Render.HTML.WZ.Match.Summary(uname, filters)
            const cmdWithUsername = `% wz ${uname} ${ Model.CallOfDuty.format.filters.objToCmd(filters) }`
            const usernameUrl = Model.CallOfDuty.format.username.url.display(uname)
            const filtersQuery = Model.CallOfDuty.format.filters.objToUrl(filters)
            const filterUrlParam = !filtersQuery ? '' : '?' + filtersQuery
            const profileLinkUrl = config.network.host.web + '/' + usernameUrl + filterUrlParam
            console.log('[>] Discord bot dispatching image from', renderHtmlFaasUrl)
            handler.reply({ content: format(['```', '', cmdWithUsername, '', '```'+profileLinkUrl]), files: [renderHtmlFaasUrl] })
        }
    }
}

export class AliasBarracksWZ extends BarracksWZ {
    public namespace:string = 'wz barracks'
}

