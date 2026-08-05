import { LeagueRanking } from '../../../domain/entities/league-ranking.entity';
import { LeagueRanking as PrismaLeagueRanking } from '@prisma/client';

export class LeagueRankingMapper {
  static toDomain(raw: PrismaLeagueRanking): LeagueRanking {
    return LeagueRanking.create({
      id: raw.id,
      leagueId: raw.leagueId,
      userId: raw.userId,
      totalPoints: raw.totalPoints,
      racesCounted: raw.racesCounted,
    });
  }

  static toPersistence(ranking: LeagueRanking) {
    return {
      id: ranking.id,
      leagueId: ranking.leagueId,
      userId: ranking.userId,
      totalPoints: ranking.totalPoints,
      racesCounted: ranking.racesCounted,
    };
  }
}