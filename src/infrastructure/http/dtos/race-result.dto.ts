import { RaceResult } from "../../../domain/entities/race-result.entity";

export class RaceResultDto {
    id!: string;
    raceId!: string;
    poleDriverId!: string;
    raceWinnerDriverId!: string;
    raceWinnerTeamId!: string;
    safetyCar!: boolean;
    dnfCount!: number;
    syncedAt!: Date;

    static fromDomain(result: RaceResult): RaceResultDto {
        return {
            id: result.id,
            raceId: result.raceId,
            poleDriverId: result.poleDriverId,
            raceWinnerDriverId: result.raceWinnerDriverId,
            raceWinnerTeamId: result.raceWinnerTeamId,
            safetyCar: result.safetyCar,
            dnfCount: result.dnfCount,
            syncedAt: result.syncedAt,
        };
    }
}