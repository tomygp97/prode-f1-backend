import { LeagueRanking } from '../entities/league-ranking.entity';

export abstract class LeagueRankingRepository {
  abstract save(ranking: LeagueRanking): Promise<void>;
  abstract findByLeagueAndUser(leagueId: string, userId: string): Promise<LeagueRanking | null>;
  abstract findAllByLeague(leagueId: string): Promise<LeagueRanking[]>;
}