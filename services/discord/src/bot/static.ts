export const invalid:string[] = [
    'Invalid command, try `help`'
]
export const playerNotFound:string[] = [
    'Player not found, try `help`'
]
export const playerNotRegistered:string[] = [
    'Player not found, try `help`'
]
export const defaultArgs:string[] = [
    '- `<platform?> = uno` (Activision)',
]
export const statsList:string[] = [
    'Available stats:',
    '```',
    'score, kills, deaths, eliminations, damageDone, damageTaken, teamWipes, revives, contracts, lootCrates,',
    'buyStations, assists, executions, headshots, wallBangs, clusterKills, airstrikeKills, longestStreak,',
    'trophyDefense, munitionShares, missileRedirects, equipmentDestroyed, percentTimeMoving, distanceTraveled',
    'teamSurvivalTime, teamPlacement, timePlayed',
    '```',
]
export const help:string[] = [
    '———————————————————————————',
    '**# First time users                                                                              #**',
    '———————————————————————————',
    'Getting started is an easy 3-step process:',
    '1) Create your account at https://profile.callofduty.com',
    '2) Sign in with your CallOfDuty account from Step #1 at https://stagg.co/login',
    '3) Relax while your match history is collected and try some of the commands below',
    '',
    '———————————————————————————',
    '**# Using the bot                                                                                  #**',
    '———————————————————————————',
    'If calling the bot in a text channel you will need to prefix messages with `%` or `@Stagg`; this is not necessary in DMs.',
    '',
    'Example:',
    '```',
    '% wz all HusKerrs',
    '```',
    'Available commands:',
    // '- `help` Get help using the Stagg Discord bot',
    // '- `stats` List all available stats (see below)',
    // '- `defaults` List all default values (see below)',
    '- `search <username> <platform?>` Find profiles matching your query',
    '- `register <email> OR <username> <platform>` Link your Discord',
    '- `wz all <username> <platform?>` Show all aggregated BR stats',
    '- `wz solos <username> <platform?>` Aggregated stats from all BR Solos matches',
    '- `wz duos <username> <platform?>` Aggregated stats from all BR Duos matches',
    '- `wz trios <username> <platform?>` Aggregated stats from all BR Trios matches',
    '- `wz quads <username> <platform?>` Aggregated stats from all BR Quads matches',
    '- `wz combined <username> <platform?>` Aggregated stats from all BR modes',
    '- `wz chart <stat> <uno>` Stats can be isolated (eg: `kills`) or ratios (eg: `kills/deaths`)',
    '',
    'To see the full list of available stats, use cmd `stats`',
    '',
    'To see the full list of default values (eg: `<platform?>`), use cmd `defaults`',
    '',
    'Additional support may be provided on an as-needed basis in the `#help` channel here: https://discord.gg/VC6P63e',
    '',
    'If you want this humble binary buck in your server, click the link below:',
    'https://discord.com/oauth2/authorize?client_id=723179755548967027&scope=bot&permissions=67584',
]
