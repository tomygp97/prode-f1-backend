import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RaceRepository } from '../../../domain/ports/race.repository';
import type { RaceMeetingData } from '../../../domain/ports/official-results.provider';

@Injectable()
export class RacePrismaRepository implements RaceRepository {
    constructor(private readonly prisma: PrismaService) {}

    async upsertFromMeeting(meeting: RaceMeetingData, seasonId: string, round: number): Promise<void> {
        await this.prisma.race.upsert({
            where: { externalId: String(meeting.externalMeetingKey) },
            create: {
                seasonId: seasonId,
                name: meeting.name,
                circuit: meeting.circuit,
                round,
                qualifyingStartAt: meeting.qualifyingStartAt,
                raceStartAt: meeting.raceStartAt,
                status: meeting.isCancelled ? 'cancelled' : 'scheduled',
                externalId: String(meeting.externalMeetingKey),
              },
              update: {
                name: meeting.name,
                circuit: meeting.circuit,
                qualifyingStartAt: meeting.qualifyingStartAt,
                raceStartAt: meeting.raceStartAt,
                status: meeting.isCancelled ? 'cancelled' : 'scheduled',
              },
        });
    }

    async findAll() {
        return this.prisma.race.findMany({ orderBy: {round: 'asc'} });
    }

    async findNext() {
        return this.prisma.race.findFirst({
            where: { status: 'scheduled', raceStartAt: { gte: new Date() } },
            orderBy: { raceStartAt: 'asc' },
        });
    }
}