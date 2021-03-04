import { validateNetworkAuth, useConfig } from '@stagg/gcp'
import { setNetworkConfig } from '@stagg/api'
import { runJob } from './worker'
import { config } from './config'

export default async (req, res) => {
    console.log('[>] Starting Discord Role Rank ETL...')
    await useConfig(config)
    console.log('[>] Configured Discord Role Rank ETL...')
    setNetworkConfig(config.network)
    console.log('[>] Network config set for API library...')
    try { await validateNetworkAuth(req,res) } catch(e) { return }
    console.log('[>] Network key validated, proceeding...')
    const { discord_id, limit, skip } = req.query as {[key:string]:string}
    console.log('[>] Running Discord rank role update:', discord_id, limit, skip)
    await runJob(discord_id, limit, skip)
    res.status(200)
    res.send({ success: true })
    res.end()
}
