// .env is only used for local
require('dotenv').config()
export interface Config {
    port: number
    api: {
        retry: number
        delay: number
        failures: number
    }
    mongo: {
        db: string
        host: string
        user: string
        pass: string
    }
    scrape: {
        wait: number
    }
}
export default {
    port: process.env.PORT || 8080,
    api: {
        retry: 3,
        delay: 100,
        failures: 1,
    },
    mongo: {
        db: process.env.MONGO_DB,
        host: process.env.MONGO_HOST,
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASS,
    },
    scrape: {
        wait: 3000
    },
} as Config
