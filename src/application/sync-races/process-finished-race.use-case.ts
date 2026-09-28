import { Injectable, Logger } from "@nestjs/common";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { RaceRepository } from "../../domain/ports/race.repository";
import { CalculateRaceScoresUseCase } from "../ranking/calculate-race-scores/calculate-race-scores.use-case";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";

/**
 * Apenas una carrera termina (OpenF1 publicó el resultado): sincroniza los resultados y
 * calcula los puntos en el momento, en vez de esperar a los crons horarios.
 * Si algo falla, SyncRaceResultsJob y CalculateScoresJob lo reintentan en la próxima hora.
 */
@Injectable()
export class ProcessFinishedRaceUseCase {
    private readonly logger = new Logger(ProcessFinishedRaceUseCase.name);

    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly syncRaceResultsUseCase: SyncRaceResultsUseCase,
        private readonly calculateRaceScoresUseCase: CalculateRaceScoresUseCase,
    ) {}

    async execute(raceId: string): Promise<void> {
        const race = await this.raceRepository.findById(raceId);
        if (!race || race.status !== RaceStatus.FINISHED) return;

        await this.syncRaceResultsUseCase.execute(race);
        await this.calculateRaceScoresUseCase.execute(race.id);

        this.logger.log(`Results and scores ready for ${race.name}`);
    }
}
