import * as JWT from 'jsonwebtoken'
import {
    Ip,
    Put,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Controller,
    NotFoundException,
    ConflictException,
    BadRequestException,
    BadGatewayException,
    UnauthorizedException,
    InternalServerErrorException,
} from '@nestjs/common'
import { AccountCredentialsDTO } from './dto'
import { AccountDAO } from './entity'
import { CallOfDutyAccountService } from './services'
import { PGSQL, JWT_SECRET } from 'src/config'

@Controller('callofduty/account')
export class CallOfDutyAccountController {
    constructor(
        private readonly acctDao: AccountDAO,
        private readonly acctSvcs: CallOfDutyAccountService,
    ) {}
    
    @Get('/user/:userId')
    async GetAccountProfiles(@Param() { userId }) {
        const [account] = await this.acctSvcs.findAllByUserId(userId)
        if (!account) {
            throw new BadRequestException('invalid user id')
        }
        const model = await this.acctSvcs.buildModelForAccountId(account.accountId)
        delete model.tokens
        delete model.email
        delete model.authId
        return model
    }

    @Get('/etl/:accountId')
    async AccountETL(@Param() { accountId }):Promise<{ success: boolean }> {
        const acct = await this.acctSvcs.buildModelForAccountId(accountId)
        if (!acct) {
            throw new BadRequestException('invalid account id')
        }
        this.acctSvcs.triggerETL(accountId)
        return { success: true }
    }

    @Put('/:accountId/unoId/:unoId')
    async SaveAccountUnoId(@Param() { accountId, unoId }):Promise<{ success: boolean }> {
        const acct = await this.acctDao.findById(accountId)
        if (!acct) {
            throw new NotFoundException('invalid account id')
        }
        acct.unoId = unoId
        await this.acctDao.update(acct)
        return { success: true }
    }

    @Put('/:accountId/profile/:platform/:username')
    async SaveAccountProfile(@Param() { accountId, platform, username }):Promise<{ success: boolean }> {
        const acct = await this.acctSvcs.buildModelForAccountId(accountId)
        if (!acct) {
            throw new NotFoundException('invalid account id')
        }
        await this.acctSvcs.insertProfileForAccountId(accountId, username, platform, acct.games)
        return { success: true }
    }

    @Delete('/:accountId/profile/:platform/:username')
    async DeleteAccountProfile(@Param() { accountId, platform, username }):Promise<{ success: boolean }> {
        const acct = await this.acctSvcs.buildModelForAccountId(accountId)
        if (!acct) {
            throw new NotFoundException('invalid account id')
        }
        await this.acctSvcs.deleteProfileForAccountId(accountId, username, platform)
        return { success: true }
    }

    @Put('/:gameId/:unoId')
    async SaveDiscoveredAccount(@Param() { gameId, unoId }):Promise<{ success: boolean }> {
        try {
            await this.acctSvcs.saveUnoIdProfile(unoId, gameId)
            return { success: true }
        } catch(e) {
            if (String(e.code) === String(PGSQL.CODE.DUPLICATE)) {
                throw new ConflictException(`duplicate profile for unoId ${unoId}`)
            }
            throw new InternalServerErrorException('something went wrong, please try again')
        }
    }

    @Put('/:gameId/:unoId/:platform/:username')
    async SaveDiscoveredAccountWithProfile(@Param() { gameId, unoId, platform, username }):Promise<{ success: boolean }> {
        try {
            await this.acctSvcs.saveUnoIdProfile(unoId, gameId, username, platform)
            return { success: true }
        } catch(e) {
            if (String(e.code) === String(PGSQL.CODE.DUPLICATE)) {
                throw new ConflictException(`duplicate profile for unoId ${unoId}`)
            }
            throw new InternalServerErrorException('something went wrong, please try again')
        }
    }

    @Post('authorize')
    async CredentialsLogin(
        @Ip() ip:string,
        @Body() body: AccountCredentialsDTO
    ) {
        try {
            const { email, tokens, games, profiles, unoId } = await this.acctSvcs.authorizationExchange(body.email, body.password)
            const accountModel = await this.acctSvcs.newSignIn(ip, email, tokens, games, profiles, unoId)
            const jwt = JWT.sign(accountModel, JWT_SECRET)
            return { jwt }
        } catch(e) {
            throw new BadGatewayException(e)
        }
    }
}
