import { Injectable, Logger } from "@nestjs/common";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { DriverRepository } from "../../domain/ports/driver.repository";
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

        const driverNumbers = [
            ...new Set([
                ...sessionResults.map(r => r.externalDriverNumber),
                poleResult.externalDriverNumber,
            ]),
        ];

        const drivers = await this.driverRepository.findByDriverNumbers(
            race.seasonId,
            driverNumbers,
        );

        const driversByNumber  = new Map(
            drivers.map(driver => [
                driver.driverNumber,
                driver,
            ]),
        );

        const poleDriver = driversByNumber.get(poleResult.externalDriverNumber);
        if (!poleDriver) {
            throw new Error(
                `Pole driver ${poleResult.externalDriverNumber} not found for season ${race.seasonId} while syncing ${race.name}`,
            );
        }

        const winnerDriver = driversByNumber.get(winner.externalDriverNumber);
        if (!winnerDriver) {
            throw new Error(
                `Race winner driver ${winner.externalDriverNumber} not found for season ${race.seasonId} while syncing ${race.name}`,
            );
        }

        const raceDriversResults: ReplaceRaceDriverResultData[] = [];
        for (const result of sessionResults) {
            const driver = driversByNumber.get(result.externalDriverNumber)
            if (!driver) {
                throw new Error(
                    `Driver ${result.externalDriverNumber} not found for season ${race.seasonId} while syncing ${race.name}`,
                );
            }

            raceDriversResults.push({
                raceId: race.id,
                driverId: driver.id,
                position: result.position,
                dnf: result.dnf,
            });
        }
        await this.raceResultRepository.upsert({
            raceId: race.id,
            poleDriverId: poleDriver.id,
            raceWinnerDriverId: winnerDriver.id,
            raceWinnerTeamId: winnerDriver.teamId,
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
}