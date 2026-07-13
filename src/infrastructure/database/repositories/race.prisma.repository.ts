import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RaceRepository } from '../../../domain/ports/race.repository';
import type { RaceMeetingData } from '../../../domain/ports/official-results.provider';
import { RaceStatus as PrismaRaceStatus } from '@prisma/client';
import { RaceStatus as DomainRaceStatus } from '../../../domain/enums/race-status.enum';

@Injectable()
export class RacePrismaRepository implements RaceRepository {
    constructor(private readonly prisma: PrismaService) {}

    async upsertFromMeeting(meeting: RaceMeetingData, seasonId: string, round: number): Promise<void> {
        await this.prisma.race.upsert({
            where: { meetingKey: meeting.meetingKey },
            create: {
                seasonId: seasonId,
                name: meeting.name,
                circuit: meeting.circuit,
                round,
                qualifyingStartAt: meeting.qualifyingStartAt,
                raceStartAt: meeting.raceStartAt,
                status: meeting.isCancelled ? PrismaRaceStatus.CANCELLED : PrismaRaceStatus.SCHEDULED,
                meetingKey: meeting.meetingKey,
                raceSessionKey: meeting.raceSessionKey,
                qualifyingSessionKey: meeting.qualifyingSessionKey,
              },
              update: {
                name: meeting.name,
                circuit: meeting.circuit,
                qualifyingStartAt: meeting.qualifyingStartAt,
                raceStartAt: meeting.raceStartAt,
                raceSessionKey: meeting.raceSessionKey,
                qualifyingSessionKey: meeting.qualifyingSessionKey,
            },    
        });
    };

    async findAll() {
        return this.prisma.race.findMany({ orderBy: {round: 'asc'} });
    };

    async findNext() {
        return this.prisma.race.findFirst({
            where: { status: PrismaRaceStatus.SCHEDULED, raceStartAt: { gte: new Date() } },
            orderBy: { raceStartAt: 'asc' },
        });
    };

    async findScheduledBeforeDate(date: Date): Promise<any[]> {
      return this.prisma.race.findMany({
        where: {
            qualifyingStartAt: { lte: date },
            status: PrismaRaceStatus.SCHEDULED,
        },
      });
    };

    async findLockedBeforeDate(date: Date): Promise<any[]> {
        return this.prisma.race.findMany({
            where: {
                raceStartAt: { lte: date },
                status: PrismaRaceStatus.LOCKED
            }
        })
    }

    async updateStatus(
        raceId: string,
        status: DomainRaceStatus
    ): Promise<void> {
        await this.prisma.race.update({
            where: { id: raceId },
            data: {
                status: this.mapStatus(status),
            },
        });
    }

    private mapStatus(status: DomainRaceStatus): PrismaRaceStatus {
        switch(status) {
            case DomainRaceStatus.SCHEDULED:
                return PrismaRaceStatus.SCHEDULED;
    
            case DomainRaceStatus.LOCKED:
                return PrismaRaceStatus.LOCKED;
    
            case DomainRaceStatus.FINISHED:
                return PrismaRaceStatus.FINISHED;
    
            case DomainRaceStatus.CANCELLED:
                return PrismaRaceStatus.CANCELLED;
    
            case DomainRaceStatus.RESULTS_SYNCED:
                return PrismaRaceStatus.RESULTS_SYNCED;
        }
    }

}