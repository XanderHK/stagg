import CallOfDutyAPI from '@callofduty/api'
import { API } from '@stagg/api'
import { MW } from '@callofduty/types'
import { config } from './config'

const isSus = (record:MW.Match.WZ):string[] => {
    const reasons:string[] = []
    for(const key in config.callofduty.wz.sus) {
        if (key === 'ratios') continue
        if (record.playerStats[key] >= config.callofduty.wz.sus[key]) {
            reasons.push(`unreasonable ${key}`)
        }
    }
    for(const ratio of config.callofduty.wz.sus.ratios) {
        if (ratio.threshold) {
            if (ratio.threshold.top > record.playerStats[ratio.top]) continue
            if (ratio.threshold.bottom > record.playerStats[ratio.bottom]) continue
        }
        if (record.playerStats[ratio.top]/(record.playerStats[ratio.bottom]||1) > ratio.limit) {
            reasons.push(`unreasonable ${ratio.top}/${ratio.bottom} ratio`)
        }
    }
    return reasons
}

export const worker = async (match_id:string):Promise<any[]> => {
    const api = new CallOfDutyAPI()
    const suspects = []
    const matchDetails = await api.MatchDetails(match_id, 'wz', 'mw')
    if (!matchDetails) {
        throw 'invalid match_id'
    }
    for(const record of <MW.Match.WZ[]>matchDetails.allPlayers) {
        const reasons = isSus(record)
        if (reasons.length) {
            let uno_username = ''
            const api = new CallOfDutyAPI(config.callofduty.bot.auth)
            await api.FriendAction(record.player.uno, 'invite')
            const friends = await api.Friends()
            for(const inv of friends.outgoingInvitations) {
              if (inv.accountId === record.player.uno) {
                uno_username = inv.username
              }
            }
            await api.FriendAction(record.player.uno, 'uninvite')
            await api.FriendAction(record.player.uno, 'remove')
            await API.CallOfDuty.WZ.Match.Suspect(record.player.uno, uno_username, match_id, reasons)
            const suspect = {
                id: record.player.uno,
                uno: uno_username,
                reasons,
            }
            suspects.push(suspect)
        }
    }
    return suspects
}
