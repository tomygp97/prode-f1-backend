import { Injectable, Logger } from "@nestjs/common";
import { Race } from "../../domain/entities/race.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { DriverRepository } from "../../domain/ports/driver.repository";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { RaceRepository } from "../../domain/ports/race.repository";
import { SyncRaceEntriesUseCase } from "./sync-race-entries.use-case";

// Una carrera LOCKED sigue siendo "la próxima" hasta unas horas después de su largada
const LOCKED_GRACE_MS = 6 * 60 * 60 * 1000;

export type SyncUpcomingGridResult =
    | { kind: 'synced'; raceName: string; sessionKey: number; drivers: number }
    | { kind: 'roster-bootstrapped'; sessionKey: number }
    | { kind: 'skipped'; reason: string };

/**
 * Mantiene al día la grilla del próximo GP. Usa la última sesión de ese fin de semana que
 * YA empezó (FP1 en adelante): los datos de sesiones futuras en OpenF1 son una copia o no existen.
 */
@Injectable()
export class SyncUpcomingGridUseCase {
    private readonly logger = new Logger(SyncUpcomingGridUseCase.name);

    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly driverRepository: DriverRepository,
        private readonly officialResultsProvider: OfficialResultsProvider,
        private readonly syncRaceEntriesUseCase: SyncRaceEntriesUseCase,
    ) {}

    async execute(now: Date = new Date()): Promise<SyncUpcomingGridResult> {
        const race = this.findUpcomingRace(await this.raceRepository.findAll(), now);
        if (!race) {
            return this.skip('No upcoming race');
        }

        const sessionKey = await this.officialResultsProvider.getLatestStartedSessionKey({
            meetingKey: race.meetingKey,
        });

        if (sessionKey) {
            const drivers = await this.syncRaceEntriesUseCase.execute(race, sessionKey, { updateCurrentTeam: true });
            return { kind: 'synced', raceName: race.name, sessionKey, drivers };
        }

        // El fin de semana todavía no empezó. Solo en arranque en frío (plantel vacío) se
        // carga el plantel desde la última sesión corrida del año, para poder predecir.
        const roster = await this.driverRepository.findAll();
        if (roster.some((driver) => driver.seasonId === race.seasonId)) {
            return this.skip(`${race.name}: no session started yet`);
        }

        const latestOfYear = await this.officialResultsProvider.getLatestStartedSessionKey({
            year: now.getUTCFullYear(),
        });
        if (!latestOfYear) {
            return this.skip('Empty roster and no session started this year');
        }

        await this.syncRaceEntriesUseCase.addMissingToRoster(race.seasonId, latestOfYear);
        this.logger.log(`Roster bootstrapped from session ${latestOfYear}`);
        return { kind: 'roster-bootstrapped', sessionKey: latestOfYear };
    }

    private findUpcomingRace(races: Race[], now: Date): Race | null {
        // Se mira la fecha y no solo el estado: recién sincronizado el calendario (base nueva)
        // todas las carreras están SCHEDULED hasta que corre UpdateRaceStatusJob.
        const candidates = races
            .filter((race) => race.raceStartAt !== null)
            .filter((race) => race.status === RaceStatus.SCHEDULED || race.status === RaceStatus.LOCKED)
            .filter((race) => race.raceStartAt!.getTime() + LOCKED_GRACE_MS >= now.getTime())
            .sort((a, b) => a.raceStartAt!.getTime() - b.raceStartAt!.getTime());

        return candidates[0] ?? null;
    }

    private skip(reason: string): SyncUpcomingGridResult {
        this.logger.log(`Upcoming grid not synced: ${reason}`);
        return { kind: 'skipped', reason };
    }
}
