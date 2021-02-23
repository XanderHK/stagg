import { validateNetworkAuth } from '@stagg/gcp'
import { initializeConfig } from './config'
import { runJob } from './worker'

export default async (req, res) => {
    try { await validateNetworkAuth(req,res) } catch(e) { return }
    const { discord_id, limit, skip } = req.query as {[key:string]:string}
    await initializeConfig()
    await runJob(discord_id, limit, skip)
    res.status(200)
    res.send({ success: true })
    res.end()
}
