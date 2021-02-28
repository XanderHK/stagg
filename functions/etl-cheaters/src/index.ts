import { validateNetworkAuth, useConfig } from '@stagg/gcp'
import { config } from './config'
import { worker } from './worker'

export default async (req, res) => {
    await useConfig(config)
    try { await validateNetworkAuth(req,res) } catch(e) { return }
    const { match_id } = req.query as {[key:string]:string}
    if (!match_id) {
        res.status(400)
        res.send({ error: 'invalid match_id'})
        return
    }
    try {
        const suspects = await worker(match_id)
        res.status(200)
        res.send({ suspects })
        res.end()
    } catch(e) {
        res.status(400)
        res.send({ error: e })
        res.end()
    }
}
