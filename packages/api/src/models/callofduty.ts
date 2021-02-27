import * as CallOfDuty from '@callofduty/types'

interface GenericProfile {
    updated: Date
    level: number
    prestige: number
    levelXpGained: number
    levelXpRemainder: number
    currentWinStreak: number
    lifetime: {
        xp: number
        wins: number
        score: number
        draws: number
        games: number
        kills: number
        deaths: number
        assists: number
        suicides: number
        headshots: number
        timePlayed: number
        shots: {
            hit: number
            miss: number
        }
    }
    record: {
        xp: number
        spm: number
        kdr: number
        score: number
        kills: number
        deaths: number
        assists: number
        winStreak: number
        killStreak: number
    }
}

export type Platform = CallOfDuty.Platform | 'discord' | 'account' | 'id'
export namespace format {
    export namespace filters {
        export const urlToObj = (q:{[key:string]:string}) => {
            const filters = {}
            for(const key in q) {
                if (!q[key]) continue
                switch(key) {
                    case 'skip':
                    case 'limit':
                        const uom = q[key].replace(/[0-9]/g, '')
                        const count = Number(q[key].replace(/[^0-9]/g, ''))
                        filters[key] = { uom, count }
                        break
                    case 'modesIncluded':
                    case 'modesExcluded':
                        filters[key] = q[key].replace(/ /g, '').split(',')
                        break
                    default:
                        filters[key] = Number(q[key])
                }
            }
        }
        export const objToUrl = (f:Match.Filters) => {
            const queries = []
            for(const key in f) {
                if (!f[key]) continue
                switch(key) {
                    case 'skip':
                    case 'limit':
                        queries.push(`${key}=${f[key]['count']}${f[key]['uom']}`)
                        break
                    case 'modesIncluded':
                    case 'modesExcluded':
                        queries.push(`${key}=${f[key].join(',')}`)
                        break
                    default:
                        queries.push(`${key}=${f[key]}`)
                }
            }
            return queries.join('&')
        }
        export const objToCmd = (f:Match.Filters) => {
            const filters = []
            for(const key in f) {
                if (!f[key]) continue
                switch(key) {
                    case 'skip':
                        filters[1] = f[key]['count'] + f[key]['uom']
                        break
                    case 'limit':
                        filters[0] = f[key]['count'] + f[key]['uom']
                        break
                    default:
                        
                }
            }
            return filters.join(' ')
        }
    }
    export namespace username {
        export const bot = (u:string) => u.split(' ').join('~')
        export const raw = (u:string) => decodeURIComponent(u.split('@').join('#').split('~').join(' '))
        export namespace url {
            export const display = (u:string) => u.split('#').join('@').split(' ').join('~')
            export const encoded = (u:string) => encodeURIComponent(format.username.raw(u))
        }
    }
}

export namespace Match {
    export interface Filters {
        limit?: Filters.Measurement
        skip?: Filters.Measurement
        xpMin?: number
        xpMax?: number
        scoreMin?: number
        scoreMax?: number
        killsMin?: number
        killsMax?: number
        deathsMin?: number
        deathsMax?: number
        timePlayedMin?: number
        timePlayedMax?: number
        teamPlacementMin?: number
        teamPlacementMax?: number
        modesIncluded?: string[]
        modesExcluded?: string[]
    }
    export namespace Filters {
        export enum UOM { Days = 'd', Weeks = 'w', Months = 'm', Years = 'y', Matches = '' }
        export type Measurement = { uom?: UOM, count: number }
    }
}

export namespace MW {
    export interface Profile extends GenericProfile {
        modes: Record<string, MW.Profile.Mode>
        weapons?: Record<string, MW.Profile.Weapon>
        equipment?: Record<string, MW.Profile.Equipment>
    }
    export namespace Profile {
        export interface Mode {
            modeId: CallOfDuty.MW.Mode.MP
            score: number
            kills: number
            deaths: number
            timePlayed: number
        }
        export interface Weapon {
            weaponId: CallOfDuty.MW.Weapon.Name
            kills: number
            deaths: number
            headshots: number
            shots: {
                hit: number
                miss: number
            }
        }
        export interface Equipment {
            equipmentId: string
            equipmentType: 'tactical' | 'lethal'
            uses: number
            hits?: number
            kills?: number
        }
    }
}
export namespace WZ {
    export interface Profile extends GenericProfile {
        modes: Record<string, WZ.Profile.Mode>
        weapons?: Record<string, MW.Profile.Weapon>
        equipment?: Record<string, MW.Profile.Equipment>
    }
    export namespace Profile {
        export interface Mode {
            modeId: CallOfDuty.MW.Mode.WZ
            score: number
            kills: number
            deaths: number
            timePlayed: number
            wins: number
            games: number
            top5: number
            top10: number
            top25: number
            downs: number
            contracts: number
            revives: number
            cash: number
        }
    }
}
