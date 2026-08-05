import { Injectable } from "@nestjs/common";
import { RaceResultRepository } from "../../../domain/ports/race-result.repository";
import { PrismaService } from "../prisma/prisma.service";
import { RaceResult } from "src/domain/entities/race-result.entity";
import { RaceResultMapper } from "../mappers/race-result.mapper";


@Injectable()
export class RaceResultPrismaRepository implements RaceResultRepository {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(data: {
        raceId: string,
        poleDriverId: string,
        raceWinnerDriverId: string,
        raceWinnerTeamId: string,
        safetyCar: boolean,
        dnfCount: number,
    }): Promise<void> {
        await this.prisma.raceResult.upsert({
            where: {raceId: data.raceId},
            create: {
                poleDriverId: data.poleDriverId,
                raceWinnerDriverId: data.raceWinnerDriverId,
                raceWinnerTeamId: data.raceWinnerTeamId,
                safetyCar: data.safetyCar,
                dnfCount: data.dnfCount,
                syncedAt: new Date(),
                race: {
                    connect: {
                        id: data.raceId,
                    }
                }
            },
            update: {
                poleDriverId: data.poleDriverId,
                raceWinnerDriverId: data.raceWinnerDriverId,
                raceWinnerTeamId: data.raceWinnerTeamId,
                safetyCar: data.safetyCar,
                dnfCount: data.dnfCount,
                syncedAt: new Date(),
            },
        });
    }

    async findByRaceId(raceId: string): Promise<RaceResult | null> {
        const raceResult = await this.prisma.raceResult.findUnique({
            where: { raceId },
        });

        if (!raceResult) {
            return null
        }
        return RaceResultMapper.toDomain(raceResult)
    }
}