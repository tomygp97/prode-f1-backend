import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SyncAllRaceResultsUseCase } from "../../application/sync-races/sync-all-race-results.use-case";

@Injectable()
export class SyncRaceResultsJob {
    private readonly logger = new Logger(SyncRaceResultsJob.name);
    constructor(private readonly syncRaceResultsUseCase: SyncAllRaceResultsUseCase) {};

    @Cron(CronExpression.EVERY_MINUTE)
    async handle() {
        this.logger.log('Starting race results synchronization...');
        try {
            await this.syncRaceResultsUseCase.execute();
        } catch (error) {
            this.logger.error('Race results synchronization failed', error);
        }
    }
}