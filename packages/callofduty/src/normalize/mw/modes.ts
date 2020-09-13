import { Schema } from '../..'

// Game modes
const Mode = (modeId:Schema.API.MW.Match.Mode) => Modes[modeId]
const Modes = {} as { [key:string]: Schema.Mode }
// BR Solos
Modes.br_87 = {
    id: 'br_87',
    games: ['mw'],
    name: 'BR Solos',
    type: 'wz',
    category: 'br',
    lobbySize: 150,
    teamSize: 1,
    gulag: true,
}
Modes.br_71 = { ...Modes.br_87, id: 'br_71' }
Modes.br_brsolo = { ...Modes.br_87, id: 'br_brsolo' }
// BR Duos
Modes.br_88 = {
    id: 'br_88',
    games: ['mw'],
    name: 'BR Duos',
    type: 'wz',
    category: 'br',
    lobbySize: 150,
    teamSize: 2,
    gulag: true,
    buybacks: true,
}
Modes.br_brduos = { ...Modes.br_88, id: 'br_brduos' }
// BR Trios
Modes.br_74 = {
    id: 'br_74',
    games: ['mw'],
    name: 'BR Trios',
    type: 'wz',
    category: 'br',
    lobbySize: 150,
    teamSize: 3,
    gulag: true,
    buybacks: true,
}
Modes.br_77 = { ...Modes.br_74, id: 'br_77' }
Modes.br_25 = { ...Modes.br_74, id: 'br_25' }
Modes.br_brtrios = { ...Modes.br_74, id: 'br_brtrios' }
// Custom trios modes
Modes.br_jugg_brtriojugr = { ...Modes.br_74, id: 'br_jugg_brtriojugr' } // juggernaut drops in trios
Modes.br_brtriostim_name2 = { ...Modes.br_74, id: 'br_brtriostim_name2' } // auto respawn if >$4500
// BR Quads
Modes.br_89 = {
    id: 'br_89',
    games: ['mw'],
    name: 'BR Quads',
    type: 'wz',
    category: 'br',
    lobbySize: 152,
    teamSize: 4,
    gulag: true,
    buybacks: true,
}
Modes.br_brquads = { ...Modes.br_89, id: 'br_brquads' }
// 200 person quads
Modes.br_brthquad = { ...Modes.br_89, id: 'br_brthquad', lobbySize: 200, name: 'BR Quads 200' }
// Realism quads
Modes.br_86 = { ...Modes.br_89, id: 'br_86', realism: true, buybacks: false, name: 'BR Realism Quads' }
Modes.br_br_real = { ...Modes.br_86, id: 'br_br_real' }
// Plunder + Misc
Modes.brtdm_rmbl = { ...Modes.br_89, lobbySize: 150, teamSize: 6, respawns: true, name: 'Warzone Rumble' }
Modes.br_mini_miniroyale = { ...Modes.br_74, lobbySize: 75, respawns: true, name: 'Mini Royale' }
Modes.br_dmz_76 = {
    id: 'br_dmz_38',
    games: ['mw'],
    name: 'Plunder',
    type: 'wz',
    category: 'plunder',
    lobbySize: 152,
    teamSize: 4,
    respawns: true,
}
Modes.br_dmz_85 = { ...Modes.br_dmz_76, id: 'br_dmz_85' }
Modes.br_dmz_104 = { ...Modes.br_dmz_76, id: 'br_dmz_104' }
Modes.br_dmz_38 = { ...Modes.br_dmz_76, id: 'br_dmz_38', lobbySize: 150, teamSize: 3, name: 'Plunder Trios' }
// Multiplayer
Modes.war = {
    id: 'war',
    games: ['mw'],
    name: 'Team Deathmatch',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: true,
}
Modes.dom = {
    id: 'dom',
    games: ['mw'],
    name: 'Domination',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: true,
}
Modes.conf = {
    id: 'conf',
    games: ['mw'],
    name: 'Kill Confirmed',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: true,
}
Modes.koth = {
    id: 'koth',
    games: ['mw'],
    name: 'Hardpoint',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: true,
}
Modes.hq = {
    id: 'hq',
    games: ['mw'],
    name: 'Headquarters',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: true,
}
Modes.dd = {
    id: 'dd',
    games: ['mw'],
    name: 'Demolition',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: true,
}
Modes.sd = {
    id: 'sd',
    games: ['mw'],
    name: 'Search + Destroy',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: false,
}
Modes.cyber = {
    id: 'cyber',
    games: ['mw'],
    name: 'Cyber Attack',
    type: 'mp',
    lobbySize: 12,
    teamSize: 6,
    respawns: false,
}
Modes.arm = {
    id: 'arm',
    games: ['mw'],
    name: 'Ground War',
    type: 'mp',
    lobbySize: 64,
    teamSize: 4,
    respawns: true,
}
Modes.gun = {
    id: 'gun',
    games: ['mw'],
    name: 'Gun Game',
    type: 'mp',
    lobbySize: 12,
    teamSize: 1,
    respawns: true,
}
Modes.arena = {
    id: 'arena',
    games: ['mw'],
    name: 'Gunfight',
    type: 'mp',
    lobbySize: 4,
    teamSize: 2,
    respawns: false,
}
Modes.hc_dd = { ...Modes.dd, id: 'hc_dd', hardcore: true, name: 'Hardcore Demolition' }
Modes.dd_hc = { ...Modes.hc_dd, id: 'dd_hc' }
Modes.hc_hq = { ...Modes.hq, id: 'hc_hq', hardcore: true, name: 'Hardcore Headquarters' }
Modes.hq_hc = { ...Modes.hc_hq, id: 'hq_hc' }
Modes.hc_sd = { ...Modes.sd, id: 'hc_sd', hardcore: true, name: 'Hardcore Search + Destroy' }
Modes.sd_hc = { ...Modes.hc_sd, id: 'sd_hc' }
Modes.hc_dom = { ...Modes.dom, id: 'hc_dom', hardcore: true, name: 'Hardcore Domination' }
Modes.dom_hc = { ...Modes.hc_dom, id: 'dom_hc' }
Modes.hc_war = { ...Modes.war, id: 'hc_war', hardcore: true, name: 'Hardcore Team Deathmatch' }
Modes.war_hc = { ...Modes.hc_war, id: 'war_hc' }
Modes.hc_conf = { ...Modes.conf, id: 'hc_conf', hardcore: true, name: 'Hardcore Kill Confirmed' }
Modes.war_hc = { ...Modes.hc_conf, id: 'war_hc' }
Modes.hc_koth = { ...Modes.koth, id: 'hc_koth', hardcore: true, name: 'Hardcore Hardpoint' }
Modes.koth_hc = { ...Modes.hc_koth, id: 'koth_hc' }
Modes.hc_cyber = { ...Modes.cyber, id: 'hc_cyber', hardcore: true, name: 'Hardcore Cyber Attack' }
Modes.cyber_hc = { ...Modes.hc_cyber, id: 'cyber_hc' }

export { Mode, Modes }