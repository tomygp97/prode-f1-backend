import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncUpcomingGridUseCase } from '../../application/sync-races/sync-upcoming-grid.use-case';

// Cada 3 h: un reemplazo anunciado durante el fin de semana entra antes de la qualy
@Injectable()
export class SyncUpcomingGridJob {
    private readonly logger = new Logger(SyncUpcomingGridJob.name);

    constructor(private readonly syncUpcomingGrid: SyncUpcomingGridUseCase) {}

    @Cron(CronExpression.EVERY_3_HOURS)
    async handle() {
        try {
            await this.syncUpcomingGrid.execute();
        } catch (error) {
            this.logger.error('Upcoming grid synchronization failed', error);
        }
    }
}
