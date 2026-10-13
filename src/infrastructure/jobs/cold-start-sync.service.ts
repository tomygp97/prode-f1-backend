import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ColdStartSyncUseCase } from '../../application/sync-races/cold-start-sync.use-case';
import { CalculateAllPendingScoresUseCase } from '../../application/ranking/calculate-all-pending-scores/calculate-all-pending-scores.use-case';

// Al arrancar la app:
// - si la season del año no tiene carreras, sincroniza calendario y plantel;
// - calcula los puntos pendientes (ej. después de una migración que pide recalcular todo),
//   sin esperar al cron de cada hora.
// Corre en segundo plano para no demorar el arranque (OpenF1 puede tardar).
@Injectable()
export class ColdStartSyncService implements OnApplicationBootstrap {
    private readonly logger = new Logger(ColdStartSyncService.name);

    constructor(
        private readonly coldStartSync: ColdStartSyncUseCase,
        private readonly calculateAllPendingScores: CalculateAllPendingScoresUseCase,
    ) {}

    onApplicationBootstrap() {
        this.coldStartSync.execute().catch((error) => {
            this.logger.error('Initial sync failed; the scheduled jobs will retry', error);
        });
        this.calculateAllPendingScores.execute().catch((error) => {
            this.logger.error('Initial score calculation failed; CalculateScoresJob will retry', error);
        });
    }
}
