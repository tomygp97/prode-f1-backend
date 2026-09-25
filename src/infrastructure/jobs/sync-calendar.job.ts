import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncCalendarUseCase } from '../../application/sync-races/sync-calendar.use-case';

// Solo calendario. La grilla y el plantel los mantiene SyncUpcomingGridJob.
@Injectable()
export class SyncCalendarJob {
    private readonly logger = new Logger(SyncCalendarJob.name);

    constructor(private readonly syncCalendarUseCase: SyncCalendarUseCase) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handle() {
        // Hardcodeado por el momento
        const seasonId = 'c280d7b8-7a5e-11f1-883d-563f2351353a';
        try {
            await this.syncCalendarUseCase.execute(2026, seasonId);
        } catch (error) {
            this.logger.error('Calendar synchronization failed', error);
        }
    }
}
