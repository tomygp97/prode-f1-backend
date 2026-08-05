import { RaceDriverResult as PrismaRaceDriverResult } from "@prisma/client";
import { RaceDriverResult } from "../../../domain/entities/race-driver-result.entity";


export class RaceDriverResultMapper {
    static toDomain(prismaRaceDriverResult: PrismaRaceDriverResult): RaceDriverResult {
        return RaceDriverResult.create({
            id: prismaRaceDriverResult.id,
            raceId: prismaRaceDriverResult.raceId,
            driverId: prismaRaceDriverResult.driverId,
            position: prismaRaceDriverResult.position,
            dnf: prismaRaceDriverResult.dnf,
        })
    }
}