const objHash = require('object-hash')
import { AbstractRepository, Column, Entity, EntityRepository, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import * as Account from '../../../account'
import * as Detail from './detail'
import { Schema as CallOfDuty } from 'callofduty'
import { BaseEntity } from '../../../../abstract'

@Entity({ name: 'mw/wz/match/loadouts', database: 'callofduty' })
@Index('idx_mwwz_loadout_matchaccount', ['match', 'account'])
class Loadout extends BaseEntity {
    @PrimaryColumn('text')
    hashId: string // objHash(loadout)

    @ManyToOne(() => Detail.Entity)
    @JoinColumn({ name: 'matchId' })
    match: Detail.Entity

    @ManyToOne(() => Account.Base.Entity)
    @JoinColumn({ name: 'accountId' })
    account: Account.Base.Entity

    @Column('citext', { nullable: true })
    pwId: CallOfDuty.MW.Weapon.Name

    @Column('smallint', { nullable: true })
    pwVariant: number

    @Column('citext', { array: true, nullable: true })
    pwAttachments: string[]

    @Column('citext', { nullable: true })
    swId: CallOfDuty.MW.Weapon.Name

    @Column('smallint', { nullable: true })
    swVariant: number

    @Column('citext', { array: true, nullable: true })
    swAttachments: string[]

    @Column('citext', { nullable: true })
    lethal: string

    @Column('citext', { nullable: true })
    tactical: string

    @Column('citext', { array: true, nullable: true })
    perks: string[]
}

@EntityRepository(Loadout)
class LoadoutRepository extends AbstractRepository<Loadout> {
    private normalize({ match, account, pwId, pwVariant, pwAttachments, swId, swVariant, swAttachments, lethal, tactical, perks }: Partial<Loadout>): Partial<Loadout> {
        const hash = objHash({ pwId, pwVariant, pwAttachments, swId, swVariant, swAttachments, lethal, tactical, perks })
        return { hashId: `${hash}.${account.accountId}`, match, account, pwId, pwVariant, pwAttachments, swId, swVariant, swAttachments, lethal, tactical, perks }
    }

    public async insertLoadout(loadout: Partial<Loadout>): Promise<Loadout> {
        return await this.repository.save(this.normalize(loadout))
    }

    public async updateLoadout(loadout: Loadout): Promise<Loadout> {
        const existing = await this.repository.findOneOrFail(loadout.hashId)
        return await this.repository.save({ ...existing, ...this.normalize(loadout) })
    }
}

export {
    Loadout as Entity,
    LoadoutRepository as Repository
}