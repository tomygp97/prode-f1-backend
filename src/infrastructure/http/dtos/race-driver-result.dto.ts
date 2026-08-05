import { RaceDriverResult } from "../../../domain/entities/race-driver-result.entity";

export class RaceDriverResultDto {
    id!: string;
    raceId!: string;
    driverId!: string;
    position!: number | null;
    dnf!: boolean;

    static fromDomain(result: RaceDriverResult): RaceDriverResultDto {
        return {
            id: result.id,
            raceId: result.raceId,
            driverId: result.driverId,
            position: result.position,
            dnf: result.dnf,
        };
    }
}