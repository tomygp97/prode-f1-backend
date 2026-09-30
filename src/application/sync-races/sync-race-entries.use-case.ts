import { Injectable, Logger } from "@nestjs/common";
import { Race } from "../../domain/entities/race.entity";
import { DriverRepository } from "../../domain/ports/driver.repository";
import { DriverData, OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { RaceEntryData, RaceEntryRepository } from "../../domain/ports/race-entry.repository";
import { TeamRepository } from "../../domain/ports/team.repository";

export interface SyncRaceEntriesOptions {
    /**
     * true solo para la carrera más reciente: además de la grilla, actualiza el equipo
     * ACTUAL de cada piloto. Con carreras viejas (sync de resultados) va en false para
     * no pisar el equipo actual con uno anterior.
     */
    updateCurrentTeam: boolean;
}

/**
 * Sincroniza la grilla de una carrera desde una sesión de OpenF1: agrega al plantel de la
 * temporada los pilotos nuevos (reemplazos incluidos) y reemplaza la grilla de esa carrera
 * con el equipo con el que corre cada uno.
 */
@Injectable()
export class SyncRaceEntriesUseCase {
    private readonly logger = new Logger(SyncRaceEntriesUseCase.name);

    constructor(
        private readonly officialResultsProvider: OfficialResultsProvider,
        private readonly teamRepository: TeamRepository,
        private readonly driverRepository: DriverRepository,
        private readonly raceEntryRepository: RaceEntryRepository,
    ) {}

    async execute(race: Race, sessionKey: number, options: SyncRaceEntriesOptions): Promise<number> {
        const drivers = await this.officialResultsProvider.getDrivers(sessionKey);

        // Sin datos (sesión sin publicar) no se toca la grilla que haya
        if (drivers.length === 0) {
            this.logger.warn(`No drivers in session ${sessionKey} for ${race.name}; grid left untouched`);
            return 0;
        }

        const entries: RaceEntryData[] = [];
        for (const driver of drivers) {
            const entry = await this.saveDriver(driver, race.seasonId, sessionKey, options.updateCurrentTeam);
            if (entry) entries.push(entry);
        }

        await this.raceEntryRepository.replaceForRace(race.id, entries);

        this.logger.log(`Synced grid of ${entries.length} drivers for ${race.name} (session ${sessionKey})`);
        return entries.length;
    }

    /**
     * Solo agrega al plantel los pilotos de la sesión que no existan, sin tocar ninguna grilla.
     * Caso raro: el que hizo la pole no larga la carrera (está en la qualy pero no en la carrera).
     */
    async addMissingToRoster(seasonId: string, sessionKey: number): Promise<void> {
        const drivers = await this.officialResultsProvider.getDrivers(sessionKey);
        for (const driver of drivers) {
            await this.saveDriver(driver, seasonId, sessionKey, false);
        }
    }

    private async saveDriver(
        driver: DriverData,
        seasonId: string,
        sessionKey: number,
        updateCurrentTeam: boolean,
    ): Promise<RaceEntryData | null> {
        if (!driver.teamName) {
            this.logger.warn(`Driver ${driver.driverNumber} has no team in session ${sessionKey}; skipped`);
            return null;
        }

        const teamId = await this.teamRepository.upsert({
            name: driver.teamName,
            colour: driver.teamColour,
            seasonId,
        });

        const driverData = {
            driverNumber: driver.driverNumber,
            name: driver.fullName,
            acronym: driver.acronym,
            teamId,
            seasonId,
        };
        const driverId = updateCurrentTeam
            ? await this.driverRepository.upsert(driverData)
            : await this.driverRepository.createIfMissing(driverData);

        return { driverId, teamId };
    }
}
