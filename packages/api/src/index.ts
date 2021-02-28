import axios, { AxiosRequestConfig } from 'axios'
import { Config } from '@stagg/gcp'
import * as Events from '@stagg/events'
import * as Model from './models'
import * as Route from './routes'

export { Model, Route, Events }

const config = <{ network: Config.Network }>{ network: {} }
export const setNetworkConfig = (network:Config.Network) => {
    Object.keys(network).forEach(k => config.network[k] = network[k])
    Events.setNetworkConfig(config.network)
}

type Res<Response> = Promise<{ data: Response, status:number, headers:any }>
type HeaderRes<Response,Headers> = Promise<{ data: Response, status:number, headers: Headers }>
export class http {
    private static async request(options:AxiosRequestConfig) {
        console.log(`[>] HTTP.${options?.method?.toUpperCase()}: ${options?.url}`)
        try {
            const { data, status, headers } = await axios(options)
            return { data, status, headers }
        } catch(e) {
            try {
                const { data, status, headers } = e.response
                return { data, status, headers }
            } catch(e) {
                return { data: null, status: 502, headers: {} }
            }
        }
    }
    private static async requestNet(options:AxiosRequestConfig) {
        console.log(`[>] GCP.HTTP.${options?.method?.toUpperCase()}: ${options?.url}`)
        return http.request({
            ...options,
            headers: { 'x-network-key': config.network.key, ...(options?.headers||{}) }
        })
    }
    public static async get(url:string, options:Partial<AxiosRequestConfig>={}) {
        return this.request({
            url,
            method: 'GET',
            ...options,
        })
    }
    public static async put(url:string, data?:any, options:Partial<AxiosRequestConfig>={}) {
        return this.request({
            url,
            data,
            method: 'PUT',
            ...options,
        })
    }
    public static async post(url:string, data?:any, options:Partial<AxiosRequestConfig>={}) {
        return this.request({
            url,
            data,
            method: 'POST',
            ...options,
        })
    }
    public static async getNet(url:string, options:Partial<AxiosRequestConfig>={}) {
        return this.requestNet({
            url,
            method: 'GET',
            ...options,
        })
    }
    public static async putNet(url:string, data?:any, options:Partial<AxiosRequestConfig>={}) {
        return this.requestNet({
            url,
            data,
            method: 'PUT',
            ...options,
        })
    }
    public static async postNet(url:string, data?:any, options:Partial<AxiosRequestConfig>={}) {
        return this.requestNet({
            url,
            data,
            method: 'POST',
            ...options,
        })
    }
}

export namespace FaaS {
    export namespace Bot {
        export const Message = async (
            recipient:{ user?:string, channel?:string },
            message:Model.Bot.Message.Input
        ):Res<{ success: Boolean }> => http.postNet(config.network.host.faas.bot.message, {
            ...recipient,
            payload: message,
        })
    }
    export namespace ETL {
        export const Account = async (
            account_id:string,
            options:{ fresh?:Boolean, redundancy?:Boolean }={},
            endTimes:{ mw?:number, cw?:number, wz?:number }={}
        ):Res<{ success: Boolean }> => http.getNet(
            config.network.host.faas.etl.account + 
            '?account_id=' + account_id +
            (endTimes?.mw ? `&mw_end=${endTimes.mw}` : '') +
            (endTimes?.cw ? `&cw_end=${endTimes.cw}` : '') +
            (endTimes?.wz ? `&wz_end=${endTimes.wz}` : '') +
            (options?.redundancy ? '&redundancy=true' : '') +
            (options?.fresh ? '&fresh=true' : '')
        )
        export const Cheaters = async (
            match_id:string
        ):Res<{ success: Boolean }> => http.getNet(
            config.network.host.faas.etl.cheaters + 
            '?match_id=' + match_id
        )
        export namespace Discord {
            export const Role = async (
                discord_id:string,
                filters:Model.CallOfDuty.Match.Filters={}
            ):Res<{ success: Boolean }> => http.getNet(
                config.network.host.faas.etl.discord.role + 
                '?discord_id=' + discord_id + 
                '&' + Model.CallOfDuty.format.filters.objToUrl(filters)
            )
        }
    }
    export namespace Render {
        export namespace HTML {
            export const URL = (
                uiUrl:string,
                uiUrlParams:string='',
                filename:string='',
                vpWidth:number|string='',
                vpHeight:number|string=''
            ) => config.network.host.faas.render.html + 
                '?url=' + uiUrl + '&width=' + vpWidth + '&height=' + vpHeight +
                '&' + uiUrlParams + '&f=/' + filename + '.jpg'
            export namespace WZ {
                export namespace Match {
                    export const Summary = (
                        unoUsername:string,
                        filters:Model.CallOfDuty.Match.Filters={}
                    ) => Render.HTML.URL(
                        '/' + Model.CallOfDuty.format.username.url.display(unoUsername),
                        Model.CallOfDuty.format.filters.objToUrl(filters),
                        unoUsername.split(' ').join('_').split('#').join('_') + '.wz.summary',
                        1000, 600
                    )
                    export const History = (
                        unoUsername:string,
                        filters:Model.CallOfDuty.Match.Filters={}
                    ) => Render.HTML.URL(
                        '/' + Model.CallOfDuty.format.username.url.display(unoUsername) + '/matches',
                        Model.CallOfDuty.format.filters.objToUrl(filters),
                        unoUsername.split(' ').join('_').split('#').join('_') + '.wz.history',
                        1000, 600
                    )
                }
            }
        }
        export namespace Chart {
            export const URL = async () => {}
        }
    }
}

export namespace API {
    export const Health = async ():Res<Route.Health> =>
        http.get(config.network.host.api + '/health')
    export namespace Account {
        export const Register = async (discordJwt:string, callofdutyJwt:string):
            HeaderRes<Route.Account.Registration, Route.Headers.Auth.Account> =>
                http.post(config.network.host.api + '/account/register', {}, { headers: { 'x-discord-provision-jwt': discordJwt, 'x-callofduty-provision-jwt': callofdutyJwt } })
    }
    export namespace Discord {
        export const Authorize = async (oauthCode:string):
            HeaderRes<Route.Discord.OAuthExchange, Route.Headers.Auth.Provision.Discord | Route.Headers.Auth.Account> =>
                http.get(config.network.host.api + '/discord/oauth/exchange/' + oauthCode)
    }
    export namespace CallOfDuty {'/callofduty/authorize'
        export const Authorize = async (email:string, password:string):
            HeaderRes<Route.CallOfDuty.Authorization, Route.Headers.Auth.Provision.CallOfDuty | Route.Headers.Auth.Account> =>
                http.post(config.network.host.api + '/callofduty/authorize', { email, password })
        export namespace WZ {
            export const Account = async (
                username:string,
                platform:Model.CallOfDuty.Platform='uno'
            ):Res<Route.CallOfDuty.Account> => http.get(
                config.network.host.api +
                '/callofduty/' + platform + '/' +
                Model.CallOfDuty.format.username.url.encoded(username)
            )
            export namespace Match {
                export const Summary = async (
                    username:string,
                    platform:Model.CallOfDuty.Platform='uno',
                    filters:Model.CallOfDuty.Match.Filters={}
                ):Res<Route.CallOfDuty.Account.WZ> => http.get(
                    config.network.host.api +
                    '/callofduty/' + platform + '/' +
                    Model.CallOfDuty.format.username.url.encoded(username) +
                    '/wz' + '?' + Model.CallOfDuty.format.filters.objToUrl(filters)
                )
                export const History = async (
                    username:string,
                    platform:Model.CallOfDuty.Platform='uno',
                    filters:Model.CallOfDuty.Match.Filters={}
                ):Res<Route.CallOfDuty.Account.WZ.Matches> => http.get(
                    config.network.host.api +
                    '/callofduty/' + platform + '/' +
                    Model.CallOfDuty.format.username.url.encoded(username) +
                    '/wz/matches' + '?' + Model.CallOfDuty.format.filters.objToUrl(filters)
                )
            }
        }
    }
}
