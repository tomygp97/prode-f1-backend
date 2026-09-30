import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UpdateRaceStatusUseCase } from '../../application/sync-races/update-race-statuses.use-case';
import { ProcessFinishedRaceUseCase } from '../../application/sync-races/process-finished-race.use-case';

@Injectable()
export class UpdateRaceStatusJob{
    private readonly logger = new Logger(UpdateRaceStatusJob.name);

    constructor(
        private readonly updateRaceStatusUseCase: UpdateRaceStatusUseCase,
        private readonly processFinishedRace: ProcessFinishedRaceUseCase,
    ) {};

    @Cron('*/2 * * * *')
    async handle() {
        let finishedRaceIds: string[];
        try {
            finishedRaceIds = await this.updateRaceStatusUseCase.execute();
        } catch (error) {
            this.logger.error('Race status update failed', error);
            return;
        }

        // Resultados y puntos apenas termina la carrera (los crons horarios quedan de respaldo)
        for (const raceId of finishedRaceIds) {
            try {
                await this.processFinishedRace.execute(raceId);
            } catch (error) {
                this.logger.error(`Could not process finished race ${raceId} now; hourly jobs will retry`, error);
            }
        }
    }
}
