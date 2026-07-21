import { Injectable, Logger } from "@nestjs/common";
import { DriverRepository } from "../../domain/ports/driver.repository";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { TeamRepository } from "../../domain/ports/team.repository";


@Injectable()
export class SyncDriversUseCase {
    private readonly logger = new Logger(SyncDriversUseCase.name);

    constructor(
        private readonly officialResultsProvider: OfficialResultsProvider,
        private readonly teamRepository: TeamRepository,
        private readonly driverRepository: DriverRepository,
    ) {}

    async execute(sessionKey: number, seasonId: string): Promise<void> {
        this.logger.log(`Syncing drivers for season ${sessionKey}...`);

        const drivers = await this.officialResultsProvider.getDrivers(sessionKey);

        for (const driver of drivers) {
            // 1. upsert del equipo primero
            const teamId = await this.teamRepository.upsert({
                name: driver.teamName,
                colour: driver.teamColour,
                seasonId,
            });

            // 2. upsert del piloto con el teamId
            await this.driverRepository.upsert({
                driverNumber: driver.driverNumber,
                name: driver.fullName,
                acronym: driver.acronym,
                teamId,
                seasonId,
            });
        }
        this.logger.log(`Synced ${drivers.length} drivers for session ${sessionKey}`);
    }
}