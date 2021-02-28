import {
    Index,
    Column,
    Entity,
    PrimaryColumn,
    EntityRepository,
} from 'typeorm'
import { BaseEntity, BaseRepository } from '../../../abstract'

@Entity({ name: 'callofduty/wz/suspects', database: 'stagg' })
class SuspectWZ extends BaseEntity {
    @PrimaryColumn('text')
    combined_id: string // <uno_id>.<match_id>

    @Column('text')
    @Index()
    uno_id: string

    @Column('citext', { nullable: true })
    uno_username: string

    @Column('text')
    @Index()
    match_id: string

    @Column('citext', { array: true })
    reasons: string[]

    @Column('uuid', { nullable: true })
    reporter_account_id?: string
}

@EntityRepository(SuspectWZ)
class SuspectWZRepository extends BaseRepository<SuspectWZ> {
    protected normailze(entity:Partial<SuspectWZ>) {
        return { ...entity }
    }
}

export {
    SuspectWZ as Entity,
    SuspectWZRepository as Repository
}
