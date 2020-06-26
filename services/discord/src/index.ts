import * as cors from 'cors'
import * as express from 'express'
import DiscordBot from './discord'
import cfg from './config'

new DiscordBot()
const app = express()
app.use(cors({ credentials: false })).listen(cfg.port, async () => {
    app.get('/', (req,res) => res.redirect('https://discord.me/ggez'))
    console.log(
        `${'\x1b[32m' /* green */}${'\x1b[1m' /* bright/bold */}`+
        `----------------------------------------------------------\n`+
        `| Stagg Discord Service\n`+
        `| http://localhost:${cfg.port}\n`+
        `----------------------------------------------------------${'\x1b[0m' /* reset */}`
    )
})
