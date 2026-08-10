import { Race as PrismaRace, RaceStatus as PrismaRaceStatus } from '@prisma/client';
import { Race } from '../../../domain/entities/race.entity';
import { RaceStatus  as DomainRaceStatus } from '../../../domain/enums/race-status.enum';

export class RaceMapper {
    static toDomain(prismaRace: PrismaRace): Race {
        return Race.create({
            id: prismaRace.id,
            seasonId: prismaRace.seasonId,
            name: prismaRace.name,
            circuit: prismaRace.circuit,
            country: prismaRace.country,
            round: prismaRace.round,
            qualifyingStartAt: prismaRace.qualifyingStartAt,
            raceStartAt: prismaRace.raceStartAt,
            status: RaceMapper.toDomainStatus(prismaRace.status),
            meetingKey: prismaRace.meetingKey,
            raceSessionKey: prismaRace.raceSessionKey,
            qualifyingSessionKey: prismaRace.qualifyingSessionKey,
            scoresCalculatedAt: prismaRace.scoresCalculatedAt,
        });
    };

    static toPersistence(race: Race) {
        return {
            id: race.id,
            seasonId: race.seasonId,
            name: race.name,
            circuit: race.circuit,
            country: race.country,
            round: race.round,
            qualifyingStartAt: race.qualifyingStartAt,
            raceStartAt: race.raceStartAt,
            status: RaceMapper.toPrismaStatus(race.status),
            meetingKey: race.meetingKey,
            raceSessionKey: race.raceSessionKey,
            qualifyingSessionKey: race.qualifyingSessionKey,
        };
    };

    private static toDomainStatus(status: PrismaRaceStatus): DomainRaceStatus {
        switch (status) {
            case PrismaRaceStatus.SCHEDULED:
                return DomainRaceStatus.SCHEDULED;
            case PrismaRaceStatus.LOCKED:
                return DomainRaceStatus.LOCKED;
            case PrismaRaceStatus.FINISHED:
                return DomainRaceStatus.FINISHED;
            case PrismaRaceStatus.CANCELLED:
                return DomainRaceStatus.CANCELLED;
            case PrismaRaceStatus.RESULTS_SYNCED:
                return DomainRaceStatus.RESULTS_SYNCED;
        }
    
        throw new Error(`Unknown Prisma race status: ${status}`);
    }

    static toPrismaStatus(status: DomainRaceStatus): PrismaRaceStatus {
        switch (status) {
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
        };
    };
};