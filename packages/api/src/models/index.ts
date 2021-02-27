export * from './account'
export * as CallOfDuty from './callofduty'
export namespace Bot {
    export namespace Message {
        export type Input = Input.Text | Input.Attachment
        export namespace Input {
            export type Text = string[]
            export type Attachment = { files: string[], content?: string }
        }
    }
}
