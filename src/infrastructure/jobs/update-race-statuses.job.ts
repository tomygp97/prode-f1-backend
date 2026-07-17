import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UpdateRaceStatusUseCase } from '../../application/sync-races/update-race-statuses.use-case';

@Injectable()
export class UpdateRaceStatusJob{
    private readonly logger = new Logger(UpdateRaceStatusJob.name);

    constructor(private readonly updateRaceStatusUseCase: UpdateRaceStatusUseCase) {};

    @Cron('*/2 * * * *')
    async handle() {
        this.logger.log('Runing update race status cron....')
        await this.updateRaceStatusUseCase.execute();
    }
}