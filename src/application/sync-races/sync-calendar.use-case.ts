import { Injectable, Logger } from "@nestjs/common";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { RaceRepository } from "../../domain/ports/race.repository";


@Injectable()
export class SyncCalendarUseCase {
    private readonly logger = new Logger(SyncCalendarUseCase.name);

    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly officialResultsProvider: OfficialResultsProvider,
    ) {}

    async execute(year: number, seasonId: string): Promise<void> {
        this.logger.log(`Syncing calendar for year ${year}...`);

        const meetings = await this.officialResultsProvider.getMeetings(year);

        // ordenamos por fecha de carrera para asignar el round correctamente
        const sorted = meetings
        .filter(m => m.raceStartAt !== null)
        .sort((a, b) => a.raceStartAt!.getTime() - b.raceStartAt!.getTime());

        for (let i = 0; i < sorted.length; i++) {
            await this.raceRepository.upsertFromMeeting(sorted[i], seasonId, i + 1);
        }

        this.logger.log(`Synced ${meetings.length} races for year ${year}`);
    }
}