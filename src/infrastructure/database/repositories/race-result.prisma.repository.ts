import { Injectable } from "@nestjs/common";
import { RaceResultRepository } from "../../../domain/ports/race-result.repository";
import { PrismaService } from "../prisma/prisma.service";


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
}