import axios, { AxiosRequestConfig } from 'axios'
import { getEnvSecret } from '@stagg/gcp'
export * as Model from './models'
export * as Route from './routes'

export class HTTP {
    private static network_key:string
    private static async request(options:AxiosRequestConfig) {
        if (!this.network_key) this.network_key = await getEnvSecret('NETWORK_KEY')
        console.log(`[>] GCP.HTTP.${options?.method?.toUpperCase()}: ${options?.url}`)
        return axios({
            ...options,
            headers: { 'x-network-key': '' }
        })
    }
    public static async get(url:string) {
        return this.request({
            url,
            method: 'GET',
        })
    }
    public static async put(url:string, data?:any) {
        return this.request({
            url,
            data,
            method: 'PUT',
        })
    }
    public static async post(url:string, data?:any) {
        return this.request({
            url,
            data,
            method: 'POST',
        })
    }
}

export namespace FaaS {
    export namespace Bot {
        export const Message = async () => {}
    }
    export namespace ETL {
        export const Account = async () => {}
        export const Cheaters = async () => {}
        export namespace Discord {
            export const Role = async () => {}
        }
    }
    export namespace Render {
        export const HTML = async () => {}
        export const Chart = async () => {}
    }
}

export namespace API {
    export const Health = async () => {}
    export namespace Discord {
        export const Authorize = async () => {}
    }
    export namespace CallOfDuty {
        export const Authorize = async () => {}
        export namespace WZ {
            export const Account = async () => {}
            export namespace Match {
                export const Summary = async () => {}
                export const History = async () => {}
            }
        }
    }
}
