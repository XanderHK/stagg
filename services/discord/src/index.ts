import * as cors from 'cors'
import * as express from 'express'
import { init } from './bot'
import cfg from './config'

const app = express()
app.use(cors({ credentials: false })).listen(cfg.port, async () => {
    init()
    app.get('/', (req,res) => res.redirect('https://discord.me/ggez'))
    app.get('/health', (req,res) => res.status(200).send('ok'))
    console.log(
        `${'\x1b[32m' /* green */}${'\x1b[1m' /* bright/bold */}`+
        `----------------------------------------------------------\n`+
        `| Stagg Discord Service\n`+
        `| http://localhost:${cfg.port}\n`+
        `----------------------------------------------------------${'\x1b[0m' /* reset */}`
    )
})
