import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RaceEntry } from '../../../domain/entities/race-entry.entity';
import { RaceEntryData, RaceEntryRepository } from '../../../domain/ports/race-entry.repository';
import { RaceGridEntryView } from '../../../domain/views/race-grid.view';
import { RaceEntryMapper } from '../mappers/race-entry.mapper';

const withDriverAndTeam = { driver: true, team: true } as const;

@Injectable()
export class RaceEntryPrismaRepository implements RaceEntryRepository {
    constructor(private readonly prisma: PrismaService) {}

    async replaceForRace(raceId: string, entries: RaceEntryData[]): Promise<void> {
        await this.prisma.$transaction([
            this.prisma.raceEntry.deleteMany({ where: { raceId } }),
            this.prisma.raceEntry.createMany({
                data: entries.map((entry) => ({ raceId, ...entry })),
            }),
        ]);
    }

    async findByRaceId(raceId: string): Promise<RaceEntry[]> {
        const entries = await this.prisma.raceEntry.findMany({ where: { raceId } });
        return entries.map(RaceEntryMapper.toDomain);
    }

    async findGridByRaceId(raceId: string): Promise<RaceGridEntryView[]> {
        const entries = await this.prisma.raceEntry.findMany({
            where: { raceId },
            include: withDriverAndTeam,
            orderBy: { driver: { driverNumber: 'asc' } },
        });
        return entries.map(RaceEntryMapper.toGridView);
    }

    async findLatestGrid(seasonId: string): Promise<RaceGridEntryView[]> {
        const latestRace = await this.prisma.race.findFirst({
            where: { seasonId, entries: { some: {} } },
            orderBy: { raceStartAt: 'desc' },
            select: { id: true },
        });
        return latestRace ? this.findGridByRaceId(latestRace.id) : [];
    }
}
