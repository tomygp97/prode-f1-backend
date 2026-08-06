import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DriverRepository, DriverRepositoryResult } from '../../../domain/ports/driver.repository';
import { Driver } from '../../../domain/entities/driver.entity';
import { DriverMapper } from '../mappers/driver.mapper';

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

    async findByDriverNumbers(seasonId: string, driverNumbers: number[]): Promise<DriverRepositoryResult[]> {
        return this.prisma.driver.findMany({
            where: {
                seasonId,
                driverNumber: {
                    in: driverNumbers,
                }
            },
            select: {
                id: true,
                driverNumber: true,
                teamId: true,
            },
        });
    }

    async findAll(): Promise<Driver[]> {
        const drivers = await this.prisma.driver.findMany({
            orderBy: { driverNumber: 'asc' },
        });

        return drivers.map(d => DriverMapper.toDomain(d));
    }

    async findById(id: string): Promise<Driver | null> {
        const driver = await this.prisma.driver.findUnique({
            where: { id },
        });

        return driver ? DriverMapper.toDomain(driver) : null
    }
}