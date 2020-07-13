export namespace Player {
    export const Find = (username:string, platform?:string) => (
        { [`profiles.${platform.toLowerCase()}`]: { $regex: username, $options: 'i' } }
    )
}
