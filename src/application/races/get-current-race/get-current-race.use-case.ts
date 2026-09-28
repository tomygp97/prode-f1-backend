import { Injectable } from "@nestjs/common";
import { Race } from "../../../domain/entities/race.entity";
import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { RaceRepository } from "../../../domain/ports/race.repository";

// Si una carrera nunca recibe resultados (OpenF1 caído, carrera suspendida), deja de mostrarse
// como "en curso" pasado este margen desde la largada
const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Carrera del fin de semana en curso: predicciones ya cerradas (empezó la qualy) y todavía
 * sin resultados. Incluye la que sigue SCHEDULED con la qualy ya empezada (hasta que el cron
 * la pasa a LOCKED). null fuera de un fin de semana de carrera.
 */
@Injectable()
export class GetCurrentRaceUseCase {
    constructor(private readonly raceRepository: RaceRepository) {}

    async execute(now: Date = new Date()): Promise<Race | null> {
        const races = await this.raceRepository.findAll();

        const inProgress = races
            .filter((race) => race.raceStartAt !== null)
            .filter((race) => race.raceStartAt!.getTime() + STALE_AFTER_MS >= now.getTime())
            .filter((race) => {
                if (race.status === RaceStatus.LOCKED || race.status === RaceStatus.FINISHED) return true;
                return race.status === RaceStatus.SCHEDULED && !race.arePredictionsOpen(now);
            })
            .sort((a, b) => a.raceStartAt!.getTime() - b.raceStartAt!.getTime());

        return inProgress[0] ?? null;
    }
}
