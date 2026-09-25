import { Injectable, NotFoundException } from "@nestjs/common";
import { RaceEntryRepository } from "../../../domain/ports/race-entry.repository";
import { RaceRepository } from "../../../domain/ports/race.repository";
import { RaceGridEntryView } from "../../../domain/views/race-grid.view";

/**
 * Grilla de una carrera. Si todavía no tiene (antes de la FP1 de ese fin de semana),
 * devuelve la última grilla conocida de la temporada: es la mejor estimación de quién corre.
 */
@Injectable()
export class GetRaceEntriesUseCase {
    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly raceEntryRepository: RaceEntryRepository,
    ) {}

    async execute(raceId: string): Promise<RaceGridEntryView[]> {
        const race = await this.raceRepository.findById(raceId);
        if (!race) {
            throw new NotFoundException('Race not found');
        }

        const grid = await this.raceEntryRepository.findGridByRaceId(race.id);
        if (grid.length > 0) return grid;

        return this.raceEntryRepository.findLatestGrid(race.seasonId);
    }
}
