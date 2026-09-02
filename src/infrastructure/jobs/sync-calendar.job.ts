import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncCalendarUseCase } from '../../application/sync-races/sync-calendar.use-case';
import { SyncDriversUseCase } from '../../application/sync-races/sync-drivers.use-case';

@Injectable()
export class SyncCalendarJob {
    private readonly logger = new Logger(SyncCalendarJob.name);

    constructor(
        private readonly syncCalendarUseCase: SyncCalendarUseCase,
        private readonly syncDriversUsecase: SyncDriversUseCase,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handle() {
        // Hardcodeado por el momento
        const seasonId = 'c280d7b8-7a5e-11f1-883d-563f2351353a';
        const meetings = await this.syncCalendarUseCase.execute(2026, seasonId);

        const now = new Date();
        const nextMeeting = meetings.find(
            (m) => m.raceStartAt !== null && m.raceStartAt > now,
        );

        if (nextMeeting?.latestSessionKey) {
            await this.syncDriversUsecase.execute(nextMeeting.latestSessionKey, seasonId);
        } else {
            this.logger.warn('No upcoming race with a session key available yet to sync drivers');
        }
    }
}