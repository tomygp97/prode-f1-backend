import { RaceDriverResult } from "../entities/race-driver-result.entity";

export interface ReplaceRaceDriverResultData {
    raceId: string;
    driverId: string;
    position: number;
    dnf: boolean;
}

export abstract class RaceDriverResultRepository {
    abstract replaceMany(
        data: ReplaceRaceDriverResultData[],
    ): Promise<void>;

    abstract findByRaceId(raceId: string): Promise<RaceDriverResult[]>;
}