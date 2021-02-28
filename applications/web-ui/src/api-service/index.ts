import { Dispatch } from 'redux'
import * as StaggAPI from '@stagg/api'
import { useDispatch } from 'react-redux'
import { config } from 'config/ui'
import { State } from 'src/redux/store'

StaggAPI.setNetworkConfig(config.network as any)
export const api = StaggAPI.API

export const apiService = (dispatch:Dispatch=useDispatch(), errorHandler:Function=()=>{}) => {
    return new API(dispatch, errorHandler)
}

class API {
    constructor(
        private readonly dispatch:Dispatch,
        private readonly errorHandler:Function,
    ) {}
    public async discordOAuthExchange(oauthCode:string):Promise<boolean> {
        const { data, headers } = await api.Discord.Authorize(oauthCode)
        if (headers['x-authorization-jwt']) {
            this.dispatch({ type: 'AUTHORIZED_ACCOUNT', payload: headers['x-authorization-jwt'] })
            return true
        }
        if (headers['x-discord-provision-jwt']) {
            this.dispatch({ type: 'PROVISIONED_DISCORD', payload: headers['x-discord-provision-jwt'] })
            return true
        }
        return false
    }
    public async callofdutyAuthorizationExchange(email:string, password:string):Promise<boolean> {
        const { data, headers } = await api.CallOfDuty.Authorize(email, password)
        if (headers['x-authorization-jwt']) {
            this.dispatch({ type: 'AUTHORIZED_ACCOUNT', payload: headers['x-authorization-jwt'] })
            return true
        }
        if (headers['x-callofduty-provision-jwt']) {
            this.dispatch({ type: 'PROVISIONED_CALLOFDUTY', payload: headers['x-callofduty-provision-jwt'] })
            return true
        }
        const { message } = data as any
        this.errorHandler(message)
        return false
    }
    public async registerProvisionedAccounts({ discord, callofduty }:State.JWTs.Provision):Promise<boolean> {
        const { data, headers } = await api.Account.Register(discord, callofduty)
        if (headers['x-authorization-jwt']) {
            this.dispatch({ type: 'AUTHORIZED_ACCOUNT', payload: headers['x-authorization-jwt'] })
            return true
        }
        this.errorHandler(JSON.stringify(data))
        return false
    }
}

