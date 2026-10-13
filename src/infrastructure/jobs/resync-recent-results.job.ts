import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResyncRecentResultsUseCase } from '../../application/sync-races/resync-recent-results.use-case';

// Cada 3 h: una penalización posterior a la carrera corrige el resultado y los puntos
@Injectable()
export class ResyncRecentResultsJob {
    private readonly logger = new Logger(ResyncRecentResultsJob.name);

    constructor(private readonly resyncRecentResults: ResyncRecentResultsUseCase) {}

    @Cron(CronExpression.EVERY_3_HOURS)
    async handle() {
        try {
            await this.resyncRecentResults.execute();
        } catch (error) {
            this.logger.error('Re-sync of recent results failed', error);
        }
    }
}
