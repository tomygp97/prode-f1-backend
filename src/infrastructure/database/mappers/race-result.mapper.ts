import { RaceResult as PrismaRaceResult } from "@prisma/client";
import { RaceResult } from "../../../domain/entities/race-result.entity";



export class RaceResultMapper {
    static toDomain(prismaRaceResult: PrismaRaceResult): RaceResult {
        return RaceResult.create({
            id: prismaRaceResult.id,
            raceId: prismaRaceResult.raceId,
            poleDriverId: prismaRaceResult.poleDriverId,
            raceWinnerDriverId: prismaRaceResult.raceWinnerDriverId,
            raceWinnerTeamId: prismaRaceResult.raceWinnerTeamId,
            safetyCar: prismaRaceResult.safetyCar,
            dnfCount: prismaRaceResult.dnfCount,
            syncedAt: prismaRaceResult.syncedAt,
        })
    }
}