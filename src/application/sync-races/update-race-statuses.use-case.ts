import { Injectable, Logger } from "@nestjs/common";
import { RaceRepository } from "../../domain/ports/race.repository";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";

@Injectable()
export class UpdateRaceStatusUseCase{
    private readonly logger = new Logger(UpdateRaceStatusUseCase.name);

    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly officialResultsProvider: OfficialResultsProvider,
    ) {}

    async execute(): Promise<void> {
        const now = new Date();

        // 1. scheduled -> locked (qualy ya empezo)
        const toLock = await this.raceRepository.findScheduledBeforeDate(now);
        for (const race of toLock) {
            await this.raceRepository.updateStatus(race.id, RaceStatus.LOCKED);
            this.logger.log(`Race ${race.name} locked`)
        }

        // 2. locked -> finished (verificamos en OpenF1 si hay resultados)
        const lockedRaces = await this.raceRepository.findLockedRacesWithPastStartTime(now)
        for (const race of lockedRaces) {
            if (!race.raceSessionKey) continue;

            const hasResults = await this.officialResultsProvider.hasRaceResults(race.raceSessionKey);
            if (hasResults) {
                await this.raceRepository.updateStatus(race.id, RaceStatus.FINISHED);
                this.logger.log(`Race ${race.name} finished`);
            }
        }
    }
}