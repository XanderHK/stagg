export * as Account from './account'
export * as CallOfDuty from './callofduty'
import { EventInput } from '../events'

export { EventInput }
export abstract class EventHandler {
    public readonly eventType:string
    public async callback(e:EventInput<any>):Promise<void> {}
}
