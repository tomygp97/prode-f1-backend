import { Injectable, Logger } from "@nestjs/common";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { DriverRepository, DriverRepositoryResult } from "../../domain/ports/driver.repository";
import { RaceEntryRepository } from "../../domain/ports/race-entry.repository";
import { SyncRaceEntriesUseCase } from "./sync-race-entries.use-case";
import { RaceResultRepository } from "../../domain/ports/race-result.repository";
import { RaceDriverResultRepository, ReplaceRaceDriverResultData } from "../../domain/ports/race-driver-result.repository";
import { RaceRepository } from "../../domain/ports/race.repository";
import { Race } from "../../domain/entities/race.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";


@Injectable()
export class SyncRaceResultsUseCase{
    private readonly logger = new Logger(SyncRaceResultsUseCase.name);

    constructor(
        private readonly officialResultsProvider: OfficialResultsProvider,
        private readonly driverRepository: DriverRepository,
        private readonly raceResultRepository: RaceResultRepository,
        private readonly raceDriverResultRepository: RaceDriverResultRepository,
        private readonly raceRepository: RaceRepository,
        private readonly raceEntryRepository: RaceEntryRepository,
        private readonly syncRaceEntriesUseCase: SyncRaceEntriesUseCase,
    ) {}

    async execute(race: Race): Promise<void> {
        this.logger.log(`Syncing results for ${race.name}`);

        if (race.status !== RaceStatus.FINISHED) {
            throw new Error(
                `Race ${race.name} is not ready for results synchronization`,
            );
        }

        if (!race.raceSessionKey) {
            throw new Error(
                `Race ${race.name} does not have a race session key`,
            );
        }

        if (!race.qualifyingSessionKey) {
            throw new Error(
                `Race ${race.name} does not have a qualifying session key`,
            );
        }

        const [sessionResults, qualifyingResults, safetyCar] = await Promise.all([
            this.officialResultsProvider.getSessionResults(race.raceSessionKey),
            this.officialResultsProvider.getSessionResults(race.qualifyingSessionKey),
            this.officialResultsProvider.hasSafetyCar(race.raceSessionKey),
        ]);

        const dnfCount = sessionResults.filter(result => result.dnf).length;

        const poleResult = qualifyingResults.find(
            result => result.position === 1
        );
        if (!poleResult) {
            throw new Error(
                `Could not find pole position for ${race.name}`
            );
        }

        const winner = sessionResults.find(
            result => result.position === 1
        );
        if (!winner) {
            throw new Error(
                `Could not find race winner for ${race.name}`
            );
        }

        // La sesión de carrera ya corrida es la fuente confiable de la grilla: trae a los
        // reemplazos de último momento. Se agregan al plantel sin pisar el equipo actual.
        await this.syncRaceEntriesUseCase.execute(race, race.raceSessionKey, { updateCurrentTeam: false });

        const driverNumbers = [
            ...new Set([
                ...sessionResults.map(r => r.externalDriverNumber),
                poleResult.externalDriverNumber,
            ]),
        ];

        let driversByNumber = await this.findDriversByNumber(race.seasonId, driverNumbers);

        // Caso raro: el de la pole no largó la carrera, así que no está en esa sesión
        if (!driversByNumber.has(poleResult.externalDriverNumber)) {
            await this.syncRaceEntriesUseCase.addMissingToRoster(race.seasonId, race.qualifyingSessionKey);
            driversByNumber = await this.findDriversByNumber(race.seasonId, driverNumbers);
        }

        const missing = driverNumbers.filter(number => !driversByNumber.has(number));
        if (missing.length > 0) {
            throw new Error(
                `Drivers ${missing.join(', ')} not found for season ${race.seasonId} while syncing ${race.name}`,
            );
        }

        // Equipo con el que corrió cada piloto ESTA carrera (grilla); si no está, su equipo actual
        const entries = await this.raceEntryRepository.findByRaceId(race.id);
        const teamIdByDriverId = new Map(entries.map(entry => [entry.driverId, entry.teamId]));
        const teamOf = (driver: DriverRepositoryResult) => teamIdByDriverId.get(driver.id) ?? driver.teamId;

        const poleDriver = driversByNumber.get(poleResult.externalDriverNumber)!;
        const winnerDriver = driversByNumber.get(winner.externalDriverNumber)!;

        const raceDriversResults: ReplaceRaceDriverResultData[] = sessionResults.map(result => {
            const driver = driversByNumber.get(result.externalDriverNumber)!;
            return {
                raceId: race.id,
                driverId: driver.id,
                teamId: teamOf(driver),
                position: result.position,
                dnf: result.dnf,
            };
        });

        await this.raceResultRepository.upsert({
            raceId: race.id,
            poleDriverId: poleDriver.id,
            raceWinnerDriverId: winnerDriver.id,
            raceWinnerTeamId: teamOf(winnerDriver),
            safetyCar,
            dnfCount,
        })

        await this.raceDriverResultRepository.replaceMany(
            raceDriversResults
        );

        await this.raceRepository.updateStatus(
            race.id,
            RaceStatus.RESULTS_SYNCED
        )

        this.logger.log(
            `Results synced successfully for ${race.name}`
        );
    }

    private async findDriversByNumber(
        seasonId: string,
        driverNumbers: number[],
    ): Promise<Map<number, DriverRepositoryResult>> {
        const drivers = await this.driverRepository.findByDriverNumbers(seasonId, driverNumbers);
        return new Map(drivers.map(driver => [driver.driverNumber, driver]));
    }
}