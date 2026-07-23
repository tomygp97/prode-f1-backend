import { League } from '../../../domain/entities/league.entity';
import { League as PrismaLeague } from '@prisma/client';

export class LeagueMapper {
  static toDomain(raw: PrismaLeague): League {
    return League.create({
      id: raw.id,
      name: raw.name,
      ownerId: raw.ownerId,
      inviteCode: raw.inviteCode,
      isPublic: raw.isPublic,
      predictionSlots: raw.predictionSlots,
      seasonId: raw.seasonId,
      trackedDriverId: raw.trackedDriverId,
    });
  }

  static toPersistence(league: League) {
    return {
      id: league.id,
      name: league.name,
      ownerId: league.ownerId,
      inviteCode: league.inviteCode,
      isPublic: league.isPublic,
      predictionSlots: league.predictionSlots,
      seasonId: league.seasonId,
      trackedDriverId: league.trackedDriverId,
    };
  }
}