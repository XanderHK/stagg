import { Controller, Get } from '@nestjs/common'

@Controller('/')
export class RootController {
    constructor() {}
    @Get('/health')
    async HealthCheck():Promise<{ rss:number, heapTotal:number, heapUsed:number }> {
        return process.memoryUsage()
    }
}
