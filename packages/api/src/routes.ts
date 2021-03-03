import { Tokens } from '@callofduty/types'
import { Model } from '.'

export namespace Headers {
    export namespace Network {
        export interface Key { 'x-network-key': string }
    }
    export namespace Auth {
        export interface Account { 'x-authorization-jwt': string }
        export namespace Provision {
            export interface Discord { 'x-discord-authorization-jwt': string }
            export interface CallOfDuty { 'x-callofduty-authorization-jwt': string }
        }
    }
}

export type Health = { rss:number, heapTotal:number, heapUsed:number }
export namespace Account {
    export interface Registration {
        account: Model.Account
    }
}
export namespace Discord {
    export interface OAuthExchange {
        account: Model.Account | null
        accountProvision: Model.Account.Discord | null
    }
}
export namespace CallOfDuty {
    export interface Authorization {
        account: Model.Account | null
        accountProvision: Model.Account.CallOfDuty | null
        authorizationProvision: Tokens
    }
    export interface Account {
        account: Model.Account
    }
    export namespace Account {
        export interface WZ extends Account {
            rank: Model.CallOfDuty.Rank
            results: Model.CallOfDuty.WZ.Match.Aggregate
        }
        export namespace WZ {
            export interface Matches extends Account {
                rank: Model.CallOfDuty.Rank
                results: Model.CallOfDuty.WZ.Match[]
            }
            export namespace Matches {
                export interface Sus {
                    success: Boolean
                }
                export interface Details extends Account {
                    rank: Model.CallOfDuty.Rank
                    results: Model.CallOfDuty.WZ.Match
                    team: {
                        account?: Model.Account
                        rank: Model.CallOfDuty.Rank
                        player?: { id: string, uno: string }
                        results: Model.CallOfDuty.WZ.Match
                    }[]
                }
            }
        }
    }
    export namespace MW {
        export interface Profile {
            account: Model.Account
            profile: Model.CallOfDuty.MW.Profile
        }
    }
    export namespace WZ {
        export interface Profile {
            account: Model.Account
            profile: Model.CallOfDuty.WZ.Profile
        }
    }
}
