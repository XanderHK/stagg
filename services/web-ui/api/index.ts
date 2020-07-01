import JWT from 'jsonwebtoken'
import JSONStream from 'JSONStream'
import { CallOfDuty } from '@stagg/api'
import * as Mongo from '@stagg/mongo'
import cfg from '../config/api'

Mongo.Config(cfg.mongo)

export const jwt = async (req, res) => {
    try {
        res.send(JWT.verify(req.query.t, cfg.jwt))
    } catch(e) {
        res.status(400).send({ error: 'invalid jwt' })
    }
}

export const meta = async (req, res) => {
    const mongo = await Mongo.Client()
    const players = await mongo.collection('players').countDocuments()
    const matches = await mongo.collection('matches.wz').countDocuments()
    const performances = await mongo.collection('performances.wz').countDocuments()
    res.send({ players, matches, performances })
}

export const search = async (req,res) => {
    const mongo = await Mongo.Client()
    const { username, platform } = JSON.parse(req.body)
    const queries = []
    if (platform) {
        queries.push({ [`profiles.${platform.toLowerCase()}`]: { $regex: username, $options: 'i' } })
    } else {
        for(const p of ['uno', 'battle', 'xbl', 'psn']) {
            queries.push({ [`profiles.${p}`]: { $regex: username, $options: 'i' } })
        }
    }
    const players = await mongo.collection('players').find({ $or: queries }).toArray()
    res.send(players.map(p => p.profiles))
}

export const ping = async (req,res) => {
    const { username, platform } = JSON.parse(req.body)
    const player = await Mongo.CallOfDuty.Get.Player(username, platform)
    if (!player) return res.status(404).send({ error: 'player not found' })
    const mongo = await Mongo.Client()
    const performances = await mongo.collection('performances.wz').find({ 'player._id': player._id }).count()
    res.send({ performances })
}

export const download = async (req,res) => {
    const mongo = await Mongo.Client()
    const { username, platform } = req.query
    const player = await Mongo.CallOfDuty.Get.Player(username, platform)
    if (!player) return res.status(404).send({ error: 'player not found' })
    mongo.collection('performances.wz').find({ 'player._id': player._id }).pipe(JSONStream.stringify()).pipe(res)
}

export const login = async (req,res) => {
    const mongo = await Mongo.Client()
    try {
        const API = new CallOfDuty()
        const { email, password } = JSON.parse(req.body)
        if (!email || !password || !email.match(/^[^@]+@[^\.]+\..+$/)) {
            return res.status(400).send({ error: 'invalid email/password' })
        }
        const auth = await API.Login(email, password)
        const userRecord = await mongo.collection('players').findOne({ email })
        if (userRecord) {
            const prevAuth = userRecord.prevAuth ? userRecord.prevAuth : []
            if (userRecord.auth) prevAuth.push(userRecord.auth)
            await mongo.collection('players').updateOne({ _id: userRecord._id }, { $set: { auth, prevAuth } })
            const { discord, profiles } = userRecord
            const jwt = JWT.sign({ email, discord, profiles }, cfg.jwt)
            return res.status(200).send({ jwt })
        }
        const { titleIdentities } = await API.Tokens(auth).Identity()
        for(const title of titleIdentities) {
            const existing = await mongo.collection('players').findOne({ [`profiles.${title.platform}`]: title.username })
            if (existing) {
                const prevAuth = existing.prevAuth ? existing.prevAuth : []
                if (existing.auth) prevAuth.push(existing.auth)
                const prevEmails = existing.prevEmails ? existing.prevEmails : []
                prevEmails.push(existing.email)
                await mongo.collection('players').updateOne({ _id: existing._id }, { $set: { email, auth, prevAuth, prevEmails } })
                const { discord, profiles } = existing
                const jwt = JWT.sign({ email, discord, profiles }, cfg.jwt)
                return res.status(200).send({ jwt })
            }
        }
        // Player does not exist, create record
        await mongo.collection('players').insertOne({ email, auth })
        const jwt = JWT.sign({ email }, cfg.jwt)
        res.status(200).send({ jwt })
    } catch(error) {
        res.status(500).send({ error })
    }
}
