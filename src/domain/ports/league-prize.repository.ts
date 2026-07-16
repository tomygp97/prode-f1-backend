import { LeaguePrize } from '../entities/league-prize.entity';

export abstract class LeaguePrizeRepository {
  abstract replaceAll(leagueId: string, prizes: LeaguePrize[]): Promise<void>;
  abstract findByLeagueId(leagueId: string): Promise<LeaguePrize[]>;
}