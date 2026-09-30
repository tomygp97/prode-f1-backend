import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ColdStartSyncUseCase } from '../../application/sync-races/cold-start-sync.use-case';

// Al arrancar la app: si la season del año no tiene carreras, sincroniza calendario y plantel.
// Corre en segundo plano para no demorar el arranque (OpenF1 puede tardar).
@Injectable()
export class ColdStartSyncService implements OnApplicationBootstrap {
    private readonly logger = new Logger(ColdStartSyncService.name);

    constructor(private readonly coldStartSync: ColdStartSyncUseCase) {}

    onApplicationBootstrap() {
        this.coldStartSync.execute().catch((error) => {
            this.logger.error('Initial sync failed; the scheduled jobs will retry', error);
        });
    }
}
