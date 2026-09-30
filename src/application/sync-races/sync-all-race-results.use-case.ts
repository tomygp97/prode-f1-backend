import { Injectable, Logger } from "@nestjs/common";
import { RaceRepository } from "../../domain/ports/race.repository";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";


@Injectable()
export class SyncAllRaceResultsUseCase {
    private readonly logger = new Logger(SyncAllRaceResultsUseCase.name);
    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly syncRaceResultsUseCase: SyncRaceResultsUseCase,
    ){}

    async execute(): Promise<void> {
        this.logger.log('Starting sync for all pending race results');

        const races = await this.raceRepository.findRacesPendingResultsSync();
        let synced = 0;
        let failed = 0;
        this.logger.log(
            `Found ${races.length} races pending results synchronization`,
        );

        for (const race of races) {
            try {
                this.logger.log(`Syncing results for ${race.name}`);

                await this.syncRaceResultsUseCase.execute(race);

                this.logger.log(
                    `Results synced successfully for ${race.name}`,
                );
                synced++;
            } catch (error) {
                this.logger.error(
                    `Failed syncing results for ${race.name}`,
                    error instanceof Error ? error.stack : error,
                );
                failed++;
            }
        }
        this.logger.log(
            `Race results sync finished. Success: ${synced}, Failed: ${failed}`,
        );
    }
}