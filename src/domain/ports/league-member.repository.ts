import { LeagueMember } from '../entities/league-member.entity';

export interface LeagueMemberRepository {
  save(member: LeagueMember): Promise<void>;
  findByLeagueAndUser(leagueId: string, userId: string): Promise<LeagueMember | null>;
  findActiveMembersByLeague(leagueId: string): Promise<LeagueMember[]>;
}