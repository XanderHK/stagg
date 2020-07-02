import Head from 'next/head'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { commaNum } from '@stagg/util'
import Card from '../../components/Card'
import Center from '../../components/Center'
import Template from '../../components/Template'
import GamesByMode from '../../components/charts/GamesByMode'
import DownsByCircle from '../../components/charts/DownsByCircle'
import TopFinishesByMode from '../../components/charts/TopFinishesByMode'
import StatByRank from '../../components/charts/StatByRank'
import StatOverTime from '../../components/charts/StatOverTime'
import WinsByMode from '../../components/charts/WinsByMode'
import cfg from '../../config'

const inferUsername = (id:string) => {
    const [name, slug] = id.split('@')
    return !slug ? name : `${name}#${slug}`
}

export interface Filters {
    timeline?:number
    stats?: {
        [key:string]: {
            min?: number
            max?: number
        }
    }
}

const Page = ({ user, count }) => {
  const router = useRouter()
  const [performances, setPerformances] = useState([])
  const username = inferUsername(router.query.id as string)
  const isMe = user?.profiles?.uno === username
  const filters:Filters = { timeline: 100, stats: { teamPlacement: { max: 20 } } }
  useEffect(() => {
      (async () => {
        const download = await fetch(`${cfg.api.host}/download?platform=uno&username=${encodeURIComponent(username)}`)
        const performances = await download.json()
        setPerformances(performances)
      })()
  }, [])

  const filteredPerformances = performances.sort((a,b) => a.startTime - b.startTime).filter((p) => {
    if (!p.stats.teamPlacement) return false
    for(const stat in p.stats) {
        if (filters.stats[stat]) {
            if (filters.stats[stat].min && p.stats[stat] < filters.stats[stat].min) return false
            if (filters.stats[stat].max && p.stats[stat] > filters.stats[stat].max) return false
        }
    }
    return true
  })

  return (
    <Template user={user}>
        <Head>
            <title>{ isMe ? '(ME) ' : '' }{ username } : { commaNum(count.performances) } Matches | Call of Duty Warzone</title>
        </Head>
        <Center>
            {
                !performances.length ? <h1>Loading { commaNum(count.performances) } matches...</h1> : (
                    <>
                        
                        <Card label="Games by Mode">
                            <GamesByMode performances={performances} />
                        </Card>
                        <Card label="Wins by Mode">
                            <WinsByMode performances={performances} />
                        </Card>
                        <Card label="Top finishes by Mode">
                            <TopFinishesByMode performances={performances} />
                        </Card>
                        <Card label="Downs by Circle">
                            <DownsByCircle performances={performances} />
                        </Card>
                        <Card label="Kills by Rank" large expandable>
                            <StatByRank
                                yStep={1}
                                color='#00ff00'
                                username={username}
                                performances={filteredPerformances}
                                stat="kills" />
                        </Card>
                        <Card label="Damage by Rank" large expandable>
                            <StatByRank
                                yStep={200}
                                color='#ffff00'
                                username={username}
                                performances={filteredPerformances}
                                stat="damageDone" />
                        </Card>
                        <Card label="Damage per Kill over time" large expanded>
                            <StatOverTime
                                yStep={100}
                                color='#ff0000'
                                username={username}
                                performances={filteredPerformances.slice(0, filters.timeline)}
                                stat={{ divisor: 'damageDone', dividend: 'kills' }} />
                        </Card>
                    </>
                )
            }
        </Center>
    </Template>
  )
}

Page.getInitialProps = async ({ query }) => {
    const username = inferUsername(query.id)
    const ping = await fetch(`${cfg.api.host}/ping`, {
        method: 'POST',
        body: JSON.stringify({ username, platform: 'uno' })
    })
    const { performances } = await ping.json()
    return { count: { performances } }
}

export default Page
