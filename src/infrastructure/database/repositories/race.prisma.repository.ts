import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Race } from '../../../domain/entities/race.entity';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { RaceMeetingData } from '../../../domain/ports/official-results.provider';
import { RaceStatus as DomainRaceStatus } from '../../../domain/enums/race-status.enum';
import { RaceStatus as PrismaRaceStatus, RaceStatus } from '@prisma/client';
import { RaceMapper } from '../mappers/race.mapper';
import { Race } from '../../../domain/entities/race.entity';

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
                country: meeting.country,
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
                country: meeting.country,
                qualifyingStartAt: meeting.qualifyingStartAt,
                raceStartAt: meeting.raceStartAt,
                raceSessionKey: meeting.raceSessionKey,
                qualifyingSessionKey: meeting.qualifyingSessionKey,
            },    
        });
    };

    async findById(id: string): Promise<Race | null> {
        const race = await this.prisma.race.findUnique({
            where: { id },
        });

        if (!race) {
            return null;
        }
        return RaceMapper.toDomain(race);
    }

    async findAll() {
        const races = await this.prisma.race.findMany({
            orderBy: { round: 'asc' }
        });
    
        return races.map(RaceMapper.toDomain);
    };

    async findNext() {
        const race = await this.prisma.race.findFirst({
            where: {
                status: PrismaRaceStatus.SCHEDULED,
                raceStartAt: { gte: new Date() }
            },
            orderBy: { raceStartAt: 'asc' },
        });
        
        return race ? RaceMapper.toDomain(race) : null;
    };

    async findScheduledBeforeDate(date: Date) {
        const races = await this.prisma.race.findMany({
            where: {
                qualifyingStartAt: { lte: date },
                status: PrismaRaceStatus.SCHEDULED,
            },
        });
    
        return races.map(RaceMapper.toDomain);
    };

    async findLockedRacesWithPastStartTime(date: Date) {
        const races = await this.prisma.race.findMany({
            where: {
                raceStartAt: { lte: date },
                status: PrismaRaceStatus.LOCKED
            }
        });
    
        return races.map(RaceMapper.toDomain);
    }

    async findRacesPendingResultsSync(): Promise<Race[]> {
        const races = await this.prisma.race.findMany({
            where: {
                status: RaceStatus.FINISHED,
            }
        });

        return races.map(race => RaceMapper.toDomain(race))
    }

    async updateStatus(
        raceId: string,
        status: DomainRaceStatus
    ): Promise<void> {
        await this.prisma.race.update({
            where: { id: raceId },
            data: {
                status: RaceMapper.toPrismaStatus(status),
            },
        });
    }

    async findById(id: string): Promise<Race | null> {
        const race = await this.prisma.race.findUnique({
            where: { id },
        });

        return race ? RaceMapper.toDomain(race) : null;
    }
}