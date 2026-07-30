import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DriverRepository } from '../../../domain/ports/driver.repository';

@Injectable()
export class DriverPrismaRepository implements DriverRepository {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(data: { driverNumber: number; name: string; acronym: string; teamId: string; seasonId: string; }): Promise<string> {
        const driver = await this.prisma.driver.upsert({
            where: { driverNumber_seasonId: { driverNumber: data.driverNumber, seasonId: data.seasonId } },
            create: {
                driverNumber: data.driverNumber,
                name: data.name,
                acronym: data.acronym,
                teamId: data.teamId,
                seasonId: data.seasonId,
              },
            update: {
                name: data.name,
                acronym: data.acronym,
                teamId: data.teamId,
            },
        });
        return driver.id;
    }

    async findByDriverNumber(driverNumber: number, seasonId: string): Promise<{ id: string, teamId: string } | null> {
        return this.prisma.driver.findUnique({
            where: { driverNumber_seasonId: { driverNumber, seasonId } },
            select: { id: true, teamId: true },
        });
    }
}