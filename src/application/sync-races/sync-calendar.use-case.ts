import { Injectable, Logger } from "@nestjs/common";
import { OfficialResultsProvider, RaceMeetingData } from "../../domain/ports/official-results.provider";
import { RaceRepository } from "../../domain/ports/race.repository";


@Injectable()
export class SyncCalendarUseCase {
    private readonly logger = new Logger(SyncCalendarUseCase.name);

    constructor(
        private readonly raceRepository: RaceRepository,
        private readonly officialResultsProvider: OfficialResultsProvider,
    ) {}

    async execute(year: number, seasonId: string): Promise<RaceMeetingData[]> {
        this.logger.log(`Syncing calendar for year ${year}...`);
    
        const meetings = await this.officialResultsProvider.getMeetings(year);
    
        const sorted = meetings
            .filter(m => m.raceStartAt !== null)
            .sort(
                (a, b) =>
                    a.raceStartAt!.getTime() - b.raceStartAt!.getTime(),
            );
    
        for (const [index, meeting] of sorted.entries()) {
            await this.raceRepository.upsertFromMeeting(
                meeting,
                seasonId,
                index + 1,
            );
        }
    
        this.logger.log(`Synced ${sorted.length} races for year ${year}`);
        return sorted;
    }
}