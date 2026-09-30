import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncSeasonCalendarUseCase } from '../../application/sync-races/sync-season-calendar.use-case';

// Solo calendario de la temporada del año actual. La grilla y el plantel los mantiene SyncUpcomingGridJob.
@Injectable()
export class SyncCalendarJob {
    private readonly logger = new Logger(SyncCalendarJob.name);

    constructor(private readonly syncSeasonCalendar: SyncSeasonCalendarUseCase) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handle() {
        try {
            await this.syncSeasonCalendar.execute();
        } catch (error) {
            this.logger.error('Calendar synchronization failed', error);
        }
    }
}
