import axios from 'axios'
import * as DB from '@stagg/db'
import { Config } from '@stagg/gcp'

export interface EventInput {
    type: string
    payload?: EventPayload
}
export interface EventPayload {
    account?: DB.Account.Entity
}

const config = <Config>{ network: {} }
export const setNetworkConfig = (network:Config.Network) => Object.keys(network).forEach(k => config.network[k] = network[k])

const dispatchEvent = async (type:string, payload:any) => {
    if (!config.network.key) throw new Error('Cannot dispatch Stagg Event without Network Key')
    console.log('[^]', config.network.host.faas.event.handler, type)
    axios.post(config.network.host.faas.event.handler, { type, payload }, { headers: { 'x-network-key': config.network.key } }).catch(() => {})
}

export namespace Account {
    export interface Payload extends EventPayload {
        account: DB.Account.Entity
    }
    export namespace Created {
        export const Type = 'account/created'
        export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
    }
    export namespace Ready {
        export const Type = 'account/ready'
        export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
    }
}

export namespace CallOfDuty {
    export namespace WZ {
        export namespace Record {
            export interface Payload extends Account.Payload {
                oldRecord: number
                newRecord: number
                oldRecordHolder: Partial<DB.Account.Entity>
            }
            export namespace Kills {
                export const Type = 'callofduty/wz/record/kills'
                export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
            }
        }
        export namespace Rank {
            export interface Payload extends Account.Payload {
                oldRank: number
                newRank: number
            }
            export namespace Up {
                export const Type = 'callofduty/wz/rank/up'
                export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
            }
            export namespace Down {
                export const Type = 'callofduty/wz/rank/down'
                export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
            }
        }
        export namespace Suspect {
            export interface Payload extends Match.Payload {
                suspect: DB.CallOfDuty.WZ.Suspect.Entity
            }
            export namespace Created {
                export const Type = 'callofduty/wz/suspect/created'
                export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
            }
        }
        export namespace Match {
            export interface Payload extends Account.Payload {
                match: DB.CallOfDuty.WZ.Match.Entity
            }
            export namespace Created {
                export const Type = 'callofduty/wz/match/created'
                export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
            }
            export namespace Discovered {
                export const Type = 'callofduty/wz/match/discovered'
                export const Trigger = async (payload:Payload) => dispatchEvent(Type, payload)
            }
        }
    }   
}
