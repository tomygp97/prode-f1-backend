import { RaceResult } from "../entities/race-result.entity";

export abstract class RaceResultRepository {
    abstract upsert(data: {
        raceId: string;
        poleDriverId: string;
        raceWinnerDriverId: string;
        raceWinnerTeamId: string;
        safetyCar: boolean;
        dnfCount: number;
    }): Promise<void>;
    
    abstract findByRaceId(raceId: string): Promise<RaceResult | null>;
}