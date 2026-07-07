import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncCalendarUseCase } from '../../application/sync-races/sync-calendar.use-case';

@Injectable()
export class SyncCalendarJob {
    private readonly logger = new Logger(SyncCalendarJob.name);

    constructor(private readonly syncCalendarUseCase: SyncCalendarUseCase) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handle() {
        this.logger.log('Running calendar sync...');
        await this.syncCalendarUseCase.execute(2026, 'c280d7b8-7a5e-11f1-883d-563f2351353a');
    }
}