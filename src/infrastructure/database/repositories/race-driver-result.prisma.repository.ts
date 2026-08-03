import { Injectable } from "@nestjs/common";
import { RaceDriverResultRepository } from "../../../domain/ports/race-driver-result.repository";
import { PrismaService } from "../prisma/prisma.service";


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
}