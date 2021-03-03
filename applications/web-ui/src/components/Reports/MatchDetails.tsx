import ordinal from 'ordinal'
import { Model, Route } from '@stagg/api'
import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { api } from 'src/api-service'
import {
    CommandDisplay,
    commaNum,
    ReportLazyLoadProps,
} from '.'

export interface Props extends Route.CallOfDuty.Account.WZ.Matches.Details {
    matchId: string
}

export interface LazyLoadProps extends ReportLazyLoadProps {
    matchId: string
}

export const Component = (props:LazyLoadProps|Props) => {
    const propsAsComplete = props as Props
    const propsAsIncomplete = props as LazyLoadProps
    if (!propsAsIncomplete.matchId) {
        throw 'Cannot lazy-load match report component without matchId'
    }
    if (!propsAsComplete.account) {
        if (!propsAsIncomplete.accountIdentifier) {
            throw 'Cannot lazy-load report component without accountIdentifier'
        }
        return <LazyLoader { ...propsAsIncomplete } />
    }
    return <View { ...propsAsComplete } />
}

const LoadingWrapper = styled.div`
    width: 680px;
    height: 480px;
`
export const LazyLoader = ({ accountIdentifier, matchId}:LazyLoadProps) => {
    const [props, setProps] = useState<Props>(null)
    const loader = async () => {
        const props = await PropsLoader({ accountIdentifier, matchId })
        setProps(props)
    }
    useEffect(() => { !props ? loader() : null })
    if (!props) {
        return (
            <LoadingWrapper>Loading...</LoadingWrapper>
        )
    }
    return (
        <View {...props} />
    )
}

export const PropsLoader = async ({ accountIdentifier, matchId }:LazyLoadProps) => {
    if (!matchId) {
        throw 'matchId required'
    }
    if (!accountIdentifier.uno) {
        throw 'uno username required'
    }
    const { data } = await api.CallOfDuty.WZ.Match.Details(accountIdentifier.uno, 'uno', matchId)
    return {
        matchId,
        ...data
    }
}

const MatchDetailsWrapper = styled.div`
    position: relative;
    background: rgba(255, 255, 255, 0.1);
    img.rank { width: 32px; }
    td { color: #ccc; }
    th { background: rgba(255, 255, 0, 0.2); color: #eee; }
    th, td { padding: 8px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.5); }
    th:nth-of-type(1), td:nth-of-type(1) { width: 15%; }
    th:nth-of-type(2), td:nth-of-type(2) { width: 35%; text-align: left; }
    th:nth-of-type(3), td:nth-of-type(3) { width: 15%; }
    th:nth-of-type(4), td:nth-of-type(4) { width: 15%; }
    th:nth-of-type(5), td:nth-of-type(5) { width: 120px; }
    th:nth-of-type(6), td:nth-of-type(6) { width: 120px; }

    .ribbon-wrapper {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        height: 100%;
        > * {
            position: absolute; top: -40px; left: -43px;
            transform: scale(0.5);
        }
    }
`
export const View = (props:Props) => {
    const uno = props.account.callofduty.profiles.find(p => p.platform === 'uno')
    const unoUsername = Model.CallOfDuty.format.username.bot(uno.username)
    const fullCommand = `% wz ${unoUsername} last`
    return (
        <MatchDetailsWrapper>
            <CommandDisplay command={fullCommand} />
            <div className="ribbon-wrapper">
                <div className="ribbon ribbon-top-left">
                    <span>
                        {props.results.teamPlacement}
                        <sup><small>{ ordinal(props.results.teamPlacement).replace(/[0-9]/g, '') }</small></sup>
                    </span>
                </div>
            </div>
            <table>
                <thead>
                <tr>
                    <th>Rank</th>
                    <th>Username</th>
                    <th>Score</th>
                    <th>Damage</th>
                    <th>Kills</th>
                    <th>Deaths</th>
                </tr>
                </thead>
                <tbody>
                {
                    props.team.map(({ rank, account, player, results }, i) => (
                        <tr key={i}>
                            <td><img className="rank" alt={`Rank ${rank.label}`} src={`/assets/images/ranks/${rank.id}.png`} /></td>
                            <td>{ !account ? player.uno : account.callofduty.profiles.find(p => p.platform === 'uno').username }</td>
                            <td>{ commaNum(results.score) }</td>
                            <td>{ commaNum(results.damageDone) }</td>
                            <td>{ results.kills }</td>
                            <td>{ results.deaths }</td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
        </MatchDetailsWrapper>
    )
}

