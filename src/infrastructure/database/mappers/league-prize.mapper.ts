import { LeaguePrize } from '../../../domain/entities/league-prize.entity';
import { LeaguePrize as PrismaLeaguePrize } from '@prisma/client';

export class LeaguePrizeMapper {
  static toDomain(raw: PrismaLeaguePrize): LeaguePrize {
    return LeaguePrize.create({
      id: raw.id,
      leagueId: raw.leagueId,
      position: raw.position,
      description: raw.description,
    });
  }

  static toPersistence(prize: LeaguePrize) {
    return {
      id: prize.id,
      leagueId: prize.leagueId,
      position: prize.position,
      description: prize.description,
    };
  }
}