import { Injectable, Logger } from "@nestjs/common";
import { RaceRepository } from "../../domain/ports/race.repository";
import { CalculateRaceScoresUseCase } from "../ranking/calculate-race-scores/calculate-race-scores.use-case";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";

// Las penalizaciones de los comisarios suelen salir en horas; las apelaciones pueden tardar más
export const RESYNC_WINDOW_DAYS = 7;

export interface ResyncedRace {
    raceId: string;
    name: string;
    changes: string[];
}

/**
 * Vuelve a consultar OpenF1 para las carreras con resultados de los últimos días. Si el
 * resultado oficial cambió, lo reemplaza y recalcula los puntos de esa carrera.
 */
@Injectable()
export class ResyncRecentResultsUseCase {
    private readonly logger = new Logger(ResyncRecentResultsUseCase.name);

    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly syncRaceResultsUseCase: SyncRaceResultsUseCase,
        private readonly calculateRaceScoresUseCase: CalculateRaceScoresUseCase,
    ) {}

    /** Devuelve las carreras cuyo resultado cambió. */
    async execute(now: Date = new Date()): Promise<ResyncedRace[]> {
        const since = new Date(now.getTime() - RESYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const races = await this.raceRepository.findResultsSyncedSince(since);
        const changed: ResyncedRace[] = [];

        for (const race of races) {
            try {
                const { changes } = await this.syncRaceResultsUseCase.execute(race);
                if (changes.length === 0) continue;

                await this.calculateRaceScoresUseCase.execute(race.id, {
                    reason: `Resultado oficial actualizado: ${changes.join(', ')}`,
                });
                changed.push({ raceId: race.id, name: race.name, changes });
            } catch (error) {
                this.logger.error(`Failed re-syncing results for ${race.name}`, error instanceof Error ? error.stack : error);
            }
        }

        this.logger.log(`Re-sync of recent results: ${races.length} races checked, ${changed.length} changed`);
        return changed;
    }
}
