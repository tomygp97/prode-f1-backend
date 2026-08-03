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
}