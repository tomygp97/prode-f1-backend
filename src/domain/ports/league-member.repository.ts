import { LeagueMember } from '../entities/league-member.entity';
import { LeagueView } from '../views/league.view';

export interface UserLeagueMembership {
  league: LeagueView;
  role: 'admin' | 'member';
  joinedAt: Date;
  membersCount: number;
  inviteCode: string;
}

export abstract class LeagueMemberRepository {
  abstract save(member: LeagueMember): Promise<void>;
  abstract findByLeagueAndUser(leagueId: string, userId: string): Promise<LeagueMember | null>;
  abstract findActiveMembersByLeague(leagueId: string): Promise<LeagueMember[]>;
  abstract findActiveLeaguesByUser(userId: string): Promise<UserLeagueMembership[]>;
}