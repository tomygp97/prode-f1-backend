import { RaceDriverResult } from "../../../domain/entities/race-driver-result.entity";

export class RaceDriverResultDto {
    id!: string;
    raceId!: string;
    driverId!: string;
    teamId!: string;
    position!: number | null;
    dnf!: boolean;

    static fromDomain(result: RaceDriverResult): RaceDriverResultDto {
        return {
            id: result.id,
            raceId: result.raceId,
            driverId: result.driverId,
            teamId: result.teamId,
            position: result.position,
            dnf: result.dnf,
        };
    }
}