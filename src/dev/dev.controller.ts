import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { SyncSeasonCalendarUseCase } from '../application/sync-races/sync-season-calendar.use-case';
import { SeasonRepository } from '../domain/ports/season.repository';
import { UpdateRaceStatusUseCase } from '../application/sync-races/update-race-statuses.use-case';
import { SyncRaceEntriesUseCase } from "../application/sync-races/sync-race-entries.use-case";
import { SyncUpcomingGridUseCase } from "../application/sync-races/sync-upcoming-grid.use-case";
import { OfficialResultsProvider } from "../domain/ports/official-results.provider";
import { SyncRaceResultsUseCase } from "../application/sync-races/sync-race-results.use-case";
import { RaceRepository } from "../domain/ports/race.repository";
import { RaceStatus } from "../domain/enums/race-status.enum";
import { SyncAllRaceResultsUseCase } from "../application/sync-races/sync-all-race-results.use-case";
import { CalculateAllPendingScoresUseCase } from "../application/ranking/calculate-all-pending-scores/calculate-all-pending-scores.use-case";

// ?year= opcional (por defecto el año actual)
function parseYear(year?: string): number {
    const parsed = Number(year);
    return Number.isInteger(parsed) && parsed > 2000 ? parsed : new Date().getUTCFullYear();
}

/**
 * Endpoints para correr a mano los cron jobs en desarrollo. No tienen auth:
 * solo se registran con ENABLE_DEV_TOOLS=true (ver RacesModule).
 */
@Controller('dev')
export class DevController {
    constructor(
        private readonly seasonRepository: SeasonRepository,
        private readonly syncSeasonCalendarUseCase: SyncSeasonCalendarUseCase,
        private readonly updateRaceStatusUseCase: UpdateRaceStatusUseCase,
        private readonly syncRaceEntriesUseCase: SyncRaceEntriesUseCase,
        private readonly syncUpcomingGridUseCase: SyncUpcomingGridUseCase,
        private readonly officialResultsProvider: OfficialResultsProvider,
        private readonly syncRaceResultsUseCase: SyncRaceResultsUseCase,
        private readonly syncAllRaceResultsUseCase: SyncAllRaceResultsUseCase,
        private readonly calculateAllPendingScores: CalculateAllPendingScoresUseCase,
        private readonly raceRepository: RaceRepository,
    ) {}

    // Ya no hace falta antes de sync-calendar (la crea sola); queda por compatibilidad
    @Get('create-season')
    async createSeason(@Query('year') year?: string) {
        return this.seasonRepository.ensureForYear(parseYear(year));
    }

    // Crea la season si no existe y sincroniza su calendario
    @Get('sync-calendar')
    async syncCalendar(@Query('year') year?: string) {
        const { season, races } = await this.syncSeasonCalendarUseCase.execute(parseYear(year));

        return {
            message: `Calendar ${season.year} synced: ${races} races`,
        };
    }

    @Get('update-race-status')
    async updateRaceStatus() {
        await this.updateRaceStatusUseCase.execute();

        return {
            message: 'Race statuses updated successfully',
        };
    }

    // Sin ?raceId: lo mismo que SyncUpcomingGridJob (grilla del próximo GP; en base vacía,
    // carga el plantel). Con ?raceId: grilla de esa carrera desde su sesión de carrera si ya
    // se corrió, o desde la última sesión empezada de su fin de semana. No pisa equipos actuales.
    @Get('sync-entries')
    async syncEntries(@Query('raceId') raceId?: string) {
        if (!raceId) {
            return this.syncUpcomingGridUseCase.execute();
        }

        const race = await this.raceRepository.findById(raceId);
        if (!race) {
            throw new NotFoundException(`Race ${raceId} not found`);
        }

        const raceAlreadyRun = race.raceStartAt !== null && race.raceStartAt <= new Date();
        const sessionKey = raceAlreadyRun && race.raceSessionKey
            ? race.raceSessionKey
            : await this.officialResultsProvider.getLatestStartedSessionKey({ meetingKey: race.meetingKey });

        if (!sessionKey) {
            throw new BadRequestException(`No session of ${race.name} has started yet`);
        }

        const drivers = await this.syncRaceEntriesUseCase.execute(race, sessionKey, { updateCurrentTeam: false });
        return { message: `Grid of ${race.name} synced from session ${sessionKey}`, drivers };
    }

    @Get('sync-race-results/:raceId')
    async syncRaceResults(@Param('raceId') raceId: string) {
        const race = await this.raceRepository.findById(raceId);
    
        if (!race) {
            throw new NotFoundException(
                `Race ${raceId} not found`,
            );
        }
    
        if (race.status !== RaceStatus.FINISHED) {
            throw new BadRequestException(
                `Race ${race.name} is not finished yet`,
            );
        }
    
        await this.syncRaceResultsUseCase.execute(race);
    
        return {
            message: `Results synced successfully for ${race.name}`,
        };
    }

    @Get('sync-all-race-results')
    async syncAllRaceResults() {
        await this.syncAllRaceResultsUseCase.execute();

        return {
            message: 'Race results synchronization completed',
        };
    }

    @Get('calculate-score')
    async syncScore() {
        await this.calculateAllPendingScores.execute();
        return {
            message: 'Calculating scores'
        }
    }
}