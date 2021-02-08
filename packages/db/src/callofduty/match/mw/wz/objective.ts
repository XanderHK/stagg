import { AbstractRepository, Column, Entity, EntityRepository, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import * as Account from '../../../account'
import * as Detail from './detail'
import { BaseEntity } from '../../../../abstract'

@Entity({ name: 'mw/wz/match/objectives', database: 'callofduty' })
@Index('idx_mwwz_objective_matchaccount', ['match', 'account'])
class Objective extends BaseEntity {
    @PrimaryColumn('text')
    combinedId: string // <matchId>.<accountId>.<objectiveId>

    @ManyToOne(() => Detail.Entity, { nullable: false })
    @JoinColumn({ name: 'matchId' })
    match: Detail.Entity

    @ManyToOne(() => Account.Base.Entity, { nullable: false })
    @JoinColumn({ name: 'accountId' })
    account: Account.Base.Entity

    @Column('citext')
    objectiveId: string

    @Column('smallint')
    objectivesEarned: number
}

@EntityRepository(Objective)
class ObjectiveRepository extends AbstractRepository<Objective> {
    private normalize({ match, account, objectiveId, objectivesEarned }: Partial<Objective>): Partial<Objective> {
        const combinedId = `${match.matchId}.${account.accountId}.${objectiveId}`
        return { combinedId, match, account, objectiveId, objectivesEarned }
    }

    public async insertObjective(objective: Partial<Objective>): Promise<Objective> {
        return await this.repository.save(this.normalize(objective))
    }

    public async updateObjective(objective: Objective): Promise<Objective> {
        const existing = await this.repository.findOneOrFail(objective.combinedId)
        return await this.repository.save({ ...existing, ...this.normalize(objective) })
    }
}

export {
    Objective as Entity,
    ObjectiveRepository as Repository
}