import ordinal from 'ordinal'
import { Model } from '@stagg/api'
import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { api } from 'src/api-service'
import {
    commaNum,
    commaToFixed,
    CommandDisplay,
    ReportLazyLoadProps,
    ReportAccountProps,
} from '.'

export interface Props extends ReportAccountProps {
    rank: {
        id: number
        label: string
    }
    results: {
        wins: number
        score: number
        games: number
        kills: number
        deaths: number
        revives: number
        avgFinish: number
        timePlayed: number
        damageDone: number
        damageTaken: number
        top10FinishRate: number
        gulagWinRate: number
        finalCircles: number
        bestKillstreak: number
        timeMovingPercentage: number
    }
}

export const Component = (props:ReportLazyLoadProps|Props) => {
    const propsAsComplete = props as Props
    const propsAsIncomplete = props as ReportLazyLoadProps
    if (!propsAsComplete.results) {
        if (!propsAsIncomplete.accountIdentifier) {
            throw 'Cannot lazy-load report component without accountIdentifier'
        }
        return <LazyLoader accountIdentifier={propsAsIncomplete.accountIdentifier} />
    }
    return <View {...propsAsComplete} />
}

const LoadingWrapper = styled.div`
    width: 680px;
    height: 480px;
`
export const LazyLoader = ({ accountIdentifier, limit='', skip='' }:ReportLazyLoadProps&{ limit?:string, skip?:string }) => {
    const [reportProps, setReportProps] = useState<Props>(null)
    const loader = async () => {
        const props = await PropsLoader({ accountIdentifier }, limit, skip)
        setReportProps(props)
    }
    useEffect(() => { !reportProps ? loader() : null })
    if (!reportProps) {
        return (
            <LoadingWrapper>Loading...</LoadingWrapper>
        )
    }
    return (
        <View {...reportProps} />
    )
}

export const PropsLoader = async ({ accountIdentifier }:ReportLazyLoadProps, limit:string='', skip:string='') => {
    if (!accountIdentifier.uno) {
        throw 'uno username required'
    }
    const filters = Model.CallOfDuty.format.filters.urlToObj({ limit, skip, modesExcluded: 'dmz' })
    const { data } = await api.CallOfDuty.WZ.Match.Summary(accountIdentifier.uno, 'uno', filters)
    if (!data.account) {
        return null
    }
    return {
        _propsLoader: { limit, skip },
        account: data.account.callofduty,
        rank: data.rank,
        results: {
            ...data.results,
            avgFinish: Math.round(data.results.teamPlacement / data.results.games) || 0,
            top10FinishRate: data.results.gamesTop10 / data.results.games,
            gulagWinRate: data.results.winsGulag / data.results.gamesGulag,
            timeMovingPercentage: (data.results.percentTimeMoving / 100) / data.results.games,
        }
    }
}



export const BarracksWrapper = styled.div`
  position: relative;
  margin: auto;
  min-width: 800px;
  max-width: 800px;
  font-family: "Open Sans Condensed", Verdana, Arial, Helvetica, sans-serif;
  .box {
    position: relative;
    background: rgba(0, 0, 0, 0.33);
    text-align: center;
    color: white;
    padding: 0 15px 15px;
    margin: 8px;
  }

  .box.small {
    position: relative;
    display: inline-block;
    width: 216px;
    height: 200px;
    margin-bottom: 16px;
  }

  .box .content.inline {
    display: inline-block;
    width: 245px;
  }

  .box .content.hide-top h3,
  .box .content.hide-top hr {
    opacity: 0;
  }

  .box.small .content {
    display: block;
  }

  /* .box.small .content::after {
    content: '';
    display: block;
    width: 150px;
    height: 150px;
    position: relative;
    z-index: 0;
    top: -180px;
    background-position: center center;
    background-repeat: no-repeat; 
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
  }
  .box.small:nth-of-type(2) .content.watch::after {
    background-image: url('https://i.imgur.com/FWWCuTG.png')
  }
  .box.small:nth-of-type(3) .content.knives::after {
    background-image: url('https://i.imgur.com/RD5Hf8r.png')
  } */
  /* killstreak: https://i.imgur.com/2WubQyT.png */
  /* bullets: https://i.imgur.com/hD9oqq6.png */
  /* crosshair: https://i.imgur.com/zup8Jkv.png */
  /* knives: https://i.imgur.com/RD5Hf8r.png */
  /* watch: https://i.imgur.com/FWWCuTG.png */
  .box::before,
  .box::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 100%;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
  }

  .box::before {
    border-bottom: 15px solid rgba(0, 0, 0, 0.33);
    border-right: 15px solid rgba(0, 0, 0, 0.33);
  }

  .box::after {
    top: 100%;
    bottom: auto;
    border-left: 15px solid rgba(0, 0, 0, 0.33);
    border-top: 15px solid rgba(0, 0, 0, 0.33);
  }

  .box hr {
    max-width: 320px;
    height: 1px;
    margin: 16px auto;
    background: -webkit-gradient(linear, 0 0, 100% 0, from(rgba(0, 0, 0, 0)), color-stop(0.5, #333333), to(rgba(0, 0, 0, 0)));
    background: -webkit-linear-gradient(left, rgba(0, 0, 0, 0), #333333, rgba(0, 0, 0, 0));
    background: -moz-linear-gradient(left, rgba(0, 0, 0, 0), #333333, rgba(0, 0, 0, 0));
    background: -o-linear-gradient(left, rgba(0, 0, 0, 0), #333333, rgba(0, 0, 0, 0));
    background: linear-gradient(left, rgba(0, 0, 0, 0), #333333, rgba(0, 0, 0, 0));
    border: 0;
  }

  .box hr::after {
    display: block;
    content: '';
    height: 30px;
    background-image: -webkit-gradient(radial, 50% 0%, 0, 50% 0%, 116, color-stop(0%, #cccccc), color-stop(100%, rgba(255, 255, 255, 0)));
    background-image: -webkit-radial-gradient(center top, farthest-side, #cccccc 0%, rgba(255, 255, 255, 0) 100%);
    background-image: -moz-radial-gradient(center top, farthest-side, #cccccc 0%, rgba(255, 255, 255, 0) 100%);
    background-image: -o-radial-gradient(center top, farthest-side, #cccccc 0%, rgba(255, 255, 255, 0) 100%);
    background-image: radial-gradient(farthest-side at center top, #cccccc 0%, rgba(255, 255, 255, 0) 100%);
  }

  .box img.weapon {
    display: block;
    width: 75%;
    margin: 0 auto;
  }

  .box img.rank {
    display: block;
    width: 40%;
    margin: 16px auto;
  }

  .box h1,
  .box h2,
  .box h3,
  .box h4 {
    margin: 0;
    padding: 0;
  }

  .box h3 {
    font-size: 1.1rem;
    color: rgb(93, 121, 130);
  }

  .box h2 {
    font-size: 1.5rem;
    color: rgb(82, 150, 255);
  }

  .box .stat {
    display: block;
    position: relative;
    height: 2.5rem;
  }

  .box.small .stat+.stat {
    margin-top: 14px;
  }

  .box .stat h2 {
    position: absolute;
    text-align: left;
    top: 0;
    right: 0;
    width: 49%;
    font-size: 1.5rem;
    margin: -3px 0 0 0;
  }

  .box .stat label {
    display: inline-block;
    position: absolute;
    left: 0;
    top: 0;
    width: 49%;
    color: #ccc;
    font-size: 0.85rem;
    font-weight: 500;
    text-align: right;
  }

  .box .stat label small {
    color: #888;
    font-size: 0.65rem;
    display: block;
  }
`

export const View = (props:Props) => {
    const uno = props.account.profiles.find(p => p.platform === 'uno')
    const cmdModifiers:string[] = []
    if (props._propsLoader?.limit) {
        cmdModifiers.push(`${props._propsLoader?.limit}`)
        if (props._propsLoader?.skip) {
            cmdModifiers.push(`${props._propsLoader?.skip}`)
        }
    }
    const fullCommand = `% wz ${Model.CallOfDuty.format.username.bot(uno?.username)} ${cmdModifiers.join(' ')}`
    return (
        <BarracksWrapper>
            <CommandDisplay command={fullCommand} />
            <div className="box small">
            <div className="content">
                <h3 className="color-caption">
                    Rank
                </h3>
                <hr />
                <h2 className="color-highlight">
                    { props.rank.label }
                </h2>
                <img className="rank" alt={`Rank ${props.rank.label}`}
                    src={`/assets/images/ranks/${props.rank.id}.png`} />
                <div className="stat">
                    <h2>
                        &nbsp;
                    </h2>
                    <label>
                        &nbsp;
                        <small>&nbsp;</small>
                    </label>
                </div>
            </div>
            </div>

            <div className="box small" style={{top: -25}}>
            <div className="content watch">
                <h3 className="color-caption">
                    Boots on the Ground
                </h3>
                <hr />
                <div className="stat">
                    <h2>
                        {commaNum(props.results.wins)}
                    </h2>
                    <label>
                        WINS
                        <small>TOTAL NUMBER</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {commaNum(props.results.games)}
                    </h2>
                    <label>
                        GAMES
                        <small>TOTAL NUMBER</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {commaToFixed(props.results.timePlayed / 60 / 60, 1)}hr
                    </h2>
                    <label>
                        TIME PLAYED
                        <small>IN-GAME ONLY</small>
                    </label>
                </div>
            </div>
            </div>

            <div className="box small" style={{top: -25}}>
            <div className="content knives">
                <h3 className="color-caption">
                    Victory and Defeat
                </h3>
                <hr />
                <div className="stat">
                    <h2 style={{marginTop: -8}}>
                        {Math.round(props.results.avgFinish)}<sup>{ordinal(Math.round(props.results.avgFinish)).replace(String(Math.round(props.results.avgFinish)), '')}</sup>
                    </h2>
                    <label>
                        FINISH
                        <small>AVERAGE</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {((props.results.top10FinishRate || 0) * 100).toFixed(1)}%
                    </h2>
                    <label>
                        TOP 10
                        <small>PERCENTAGE</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {((props.results.gulagWinRate || 0) * 100).toFixed(1)}%
                    </h2>
                    <label>
                        GULAG WIN
                        <small>PERCENTAGE</small>
                    </label>
                </div>
            </div>
            </div>

            <div className="box">
            <div className="content inline hide-top">
                <h3 className="color-caption">
                    Kill or be Killed
                </h3>
                <hr />
                <div className="stat">
                    <h2>
                        {commaNum(props.results.revives)}
                    </h2>
                    <label>
                        REVIVES
                        <small>TOTAL NUMBER</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {((props.results.timeMovingPercentage || 0) * 100).toFixed(1)}%
                    </h2>
                    <label>
                        TIME MOVING
                        <small>PERCENTAGE</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {commaNum(props.results.finalCircles)}
                    </h2>
                    <label>
                        FINAL CIRCLES
                        <small>TOTAL NUMBER</small>
                    </label>
                </div>
            </div>

            <div className="content inline">
                <h3 className="color-caption">
                    Kill or be Killed
                </h3>
                <hr />
                <div className="stat">
                    <h2>
                        {commaToFixed(props.results.kills / (props.results.games || 1), 2)}
                    </h2>
                    <label>
                        KILLS
                        <small>AVG PER GAME</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {commaToFixed(props.results.score / (props.results.games || 1), 0)}
                    </h2>
                    <label>
                        SCORE
                        <small>AVG PER GAME</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {commaToFixed(props.results.damageDone / (props.results.games || 1), 1)}
                    </h2>
                    <label>
                        DAMAGE
                        <small>AVG PER GAME</small>
                    </label>
                </div>
            </div>

            <div className="content inline hide-top">
                <h3 className="color-caption">
                    Kill or be Killed
                </h3>
                <hr />
                <div className="stat">
                    <h2>
                        {(props.results.kills / (props.results.deaths || 1)).toFixed(2)}
                    </h2>
                    <label>
                        K/D RATIO
                        <small>AVERAGE OVERALL</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {commaToFixed((props.results.score || 0) / (((props.results.timePlayed || 0) / 60) || 1))}
                    </h2>
                    <label>
                        SCORE / MIN
                        <small>AVERAGE OVERALL</small>
                    </label>
                </div>
                <div className="stat">
                    <h2>
                        {(props.results.damageDone / (props.results.damageTaken || 1)).toFixed(2)}
                    </h2>
                    <label>
                        DD/DT RATIO
                        <small>DMG DONE / TAKEN</small>
                    </label>
                </div>
            </div>
            </div>
        </BarracksWrapper>
    )
}

