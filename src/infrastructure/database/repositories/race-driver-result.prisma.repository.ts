import { Injectable } from "@nestjs/common";
import { RaceDriverResultRepository } from "../../../domain/ports/race-driver-result.repository";
import { PrismaService } from "../prisma/prisma.service";
import { RaceDriverResult } from "src/domain/entities/race-driver-result.entity";
import { RaceDriverResultMapper } from "../mappers/race-driver-result.mapper";


@Injectable()
export class RaceDriverResultPrismaRepository implements RaceDriverResultRepository {
    constructor(private readonly prisma: PrismaService) {}

    async replaceMany(data: {
            raceId: string;
            driverId: string;
            position: number;
            dnf: boolean;
        }[]
    ): Promise<void> {
        if (data.length === 0) return;
        const raceId = data[0].raceId;

        await this.prisma.$transaction([
            this.prisma.raceDriverResult.deleteMany({
                where: {raceId}
            }),
    
            this.prisma.raceDriverResult.createMany({
                data: data,
            }),
        ]);
    };

    async findByRaceId(raceId: string): Promise<RaceDriverResult[]> {
        const results = await this.prisma.raceDriverResult.findMany({
            where: { raceId },
            orderBy: { position: 'asc' },
        });

        return results.map(
            r => RaceDriverResultMapper.toDomain(r)
        );
    }
}