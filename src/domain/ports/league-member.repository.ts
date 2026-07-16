import { LeagueMember } from '../entities/league-member.entity';

export abstract class LeagueMemberRepository {
  abstract save(member: LeagueMember): Promise<void>;
  abstract findByLeagueAndUser(leagueId: string, userId: string): Promise<LeagueMember | null>;
  abstract findActiveMembersByLeague(leagueId: string): Promise<LeagueMember[]>;
}