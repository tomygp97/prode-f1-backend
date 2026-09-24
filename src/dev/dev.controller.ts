import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { SyncCalendarUseCase } from '../application/sync-races/sync-calendar.use-case';
import { UpdateRaceStatusUseCase } from '../application/sync-races/update-race-statuses.use-case';
import { PrismaService } from "../infrastructure/database/prisma/prisma.service";
import { SyncDriversUseCase } from "../application/sync-races/sync-drivers.use-case";
import { SyncRaceResultsUseCase } from "../application/sync-races/sync-race-results.use-case";
import { RaceRepository } from "../domain/ports/race.repository";
import { RaceStatus } from "../domain/enums/race-status.enum";
import { SyncAllRaceResultsUseCase } from "../application/sync-races/sync-all-race-results.use-case";
import { CalculateAllPendingScoresUseCase } from "../application/ranking/calculate-all-pending-scores/calculate-all-pending-scores.use-case";

// Hardcodeado por el momento, igual que en SyncCalendarJob
const SEASON_YEAR = 2026;
const SEASON_ID = 'c280d7b8-7a5e-11f1-883d-563f2351353a';

/**
 * Endpoints para correr a mano los cron jobs en desarrollo. No tienen auth:
 * solo se registran con ENABLE_DEV_TOOLS=true (ver RacesModule).
 */
@Controller('dev')
export class DevController {
    constructor(
        private readonly syncCalendarUseCase: SyncCalendarUseCase,
        private readonly updateRaceStatusUseCase: UpdateRaceStatusUseCase,
        private readonly syncDriversUseCase: SyncDriversUseCase,
        private readonly syncRaceResultsUseCase: SyncRaceResultsUseCase,
        private readonly syncAllRaceResultsUseCase: SyncAllRaceResultsUseCase,
        private readonly calculateAllPendingScores: CalculateAllPendingScoresUseCase,
        private readonly raceRepository: RaceRepository,
        private readonly prisma: PrismaService,
    ) {}

    // 1. Crear una season primero
    @Get('create-season')
    async createSeason() {
        const season = await this.prisma.season.upsert({
            where: { id: SEASON_ID },
            update: {},
            create: { id: SEASON_ID, year: SEASON_YEAR },
        });

        return season;
    }

    @Get('sync-calendar')
    async syncCalendar() {
        await this.syncCalendarUseCase.execute(SEASON_YEAR, SEASON_ID);

        return {
            message: 'Calendar synced successfully',
        };
    }

    @Get('update-race-status')
    async updateRaceStatus() {
        await this.updateRaceStatusUseCase.execute();

        return {
            message: 'Race statuses updated successfully',
        };
    }

    // Sin ?sessionKey usa la última carrera ya corrida: si se usara una vieja, faltarían
    // los pilotos que entraron a mitad de temporada y fallaría el sync de resultados.
    @Get('sync-drivers')
    async syncDrivers(@Query('sessionKey') sessionKeyParam?: string) {
        let sessionKey = sessionKeyParam ? Number(sessionKeyParam) : null;

        if (!sessionKey) {
            const lastRace = await this.prisma.race.findFirst({
                where: {
                    seasonId: SEASON_ID,
                    raceStartAt: { lte: new Date() },
                    raceSessionKey: { not: null },
                },
                orderBy: { raceStartAt: 'desc' },
            });
            if (!lastRace?.raceSessionKey) {
                throw new BadRequestException('No past race with a session key: run /dev/sync-calendar first or pass ?sessionKey=');
            }
            sessionKey = lastRace.raceSessionKey;
        }

        await this.syncDriversUseCase.execute(sessionKey, SEASON_ID);
        return { message: `Drivers synced from session ${sessionKey}` };
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