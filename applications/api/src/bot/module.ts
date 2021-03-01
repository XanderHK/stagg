import { Account, Discord, CallOfDuty } from '@stagg/db'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BotService } from './services'
import { BotController } from './controller'
import { DbModule } from '../module.db'
import { CallOfDutyModule } from 'src/callofduty/module'
import { AccountModule } from 'src/account/module'
import { CallOfDutyDB } from 'src/callofduty/services'

@Module({
  imports: [
    DbModule,
    AccountModule,
    CallOfDutyModule,
    TypeOrmModule.forFeature([
      Account.Repository,
      Discord.Log.Voice.Repository,
      Discord.Log.Message.Repository,
      Discord.Log.Response.Repository,
      Discord.Settings.Features.Repository,
      CallOfDuty.MW.Match.Repository,
      CallOfDuty.WZ.Match.Repository,
      CallOfDuty.WZ.Suspect.Repository,
      CallOfDuty.MW.Profile.Repository,
      CallOfDuty.MW.Profile.Mode.Repository,
      CallOfDuty.WZ.Profile.Mode.Repository,
      CallOfDuty.MW.Profile.Weapon.Repository,
      CallOfDuty.MW.Profile.Equipment.Repository,
    ], 'stagg'),
  ],
  controllers: [BotController],
  exports: [BotService],
  providers: [BotService, CallOfDutyDB],
})
export class BotModule {}
