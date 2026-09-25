import { Injectable, Logger } from "@nestjs/common";
import { Season } from "../../domain/entities/season.entity";
import { SeasonRepository } from "../../domain/ports/season.repository";
import { SyncCalendarUseCase } from "./sync-calendar.use-case";

/**
 * Calendario de la temporada del año (por defecto, el año actual). Crea la season si no
 * existe, así una base nueva o un año nuevo arrancan solos, sin ids hardcodeados.
 */
@Injectable()
export class SyncSeasonCalendarUseCase {
    private readonly logger = new Logger(SyncSeasonCalendarUseCase.name);

    constructor(
        private readonly seasonRepository: SeasonRepository,
        private readonly syncCalendarUseCase: SyncCalendarUseCase,
    ) {}

    async execute(year: number = new Date().getUTCFullYear()): Promise<{ season: Season; races: number }> {
        const season = await this.seasonRepository.ensureForYear(year);
        const meetings = await this.syncCalendarUseCase.execute(year, season.id);
        this.logger.log(`Season ${year} calendar: ${meetings.length} races`);
        return { season, races: meetings.length };
    }
}
