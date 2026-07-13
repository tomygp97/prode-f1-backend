import { LeaguePrize } from '../entities/league-prize.entity';

export interface LeaguePrizeRepository {
  replaceAll(leagueId: string, prizes: LeaguePrize[]): Promise<void>;
  findByLeagueId(leagueId: string): Promise<LeaguePrize[]>;
}