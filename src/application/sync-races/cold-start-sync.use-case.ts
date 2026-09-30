import { Injectable, Logger } from "@nestjs/common";
import { RaceRepository } from "../../domain/ports/race.repository";
import { SeasonRepository } from "../../domain/ports/season.repository";
import { SyncSeasonCalendarUseCase } from "./sync-season-calendar.use-case";
import { SyncUpcomingGridUseCase } from "./sync-upcoming-grid.use-case";

/**
 * Base vacía (primer deploy) o año nuevo sin calendario: carga el calendario y el plantel
 * sin esperar al cron de medianoche. Con datos ya cargados no hace nada.
 * Los estados y resultados de las carreras pasadas los completan los crons de siempre.
 */
@Injectable()
export class ColdStartSyncUseCase {
    private readonly logger = new Logger(ColdStartSyncUseCase.name);

    constructor(
        private readonly seasonRepository: SeasonRepository,
        private readonly raceRepository: RaceRepository,
        private readonly syncSeasonCalendar: SyncSeasonCalendarUseCase,
        private readonly syncUpcomingGrid: SyncUpcomingGridUseCase,
    ) {}

    async execute(now: Date = new Date()): Promise<'skipped' | 'synced'> {
        const year = now.getUTCFullYear();
        const season = await this.seasonRepository.findByYear(year);
        const races = season
            ? (await this.raceRepository.findAll()).filter((race) => race.seasonId === season.id)
            : [];

        if (races.length > 0) {
            return 'skipped';
        }

        this.logger.log(`No races for season ${year}: running initial sync`);
        await this.syncSeasonCalendar.execute(year);
        await this.syncUpcomingGrid.execute(now);
        return 'synced';
    }
}
