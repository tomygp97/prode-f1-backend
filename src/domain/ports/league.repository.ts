import { League } from '../entities/league.entity';
import { LeagueMember } from '../entities/league-member.entity';
import { LeagueView } from '../views/league.view';

export interface PublicLeagueWithMemberCount {
  league: LeagueView;
  memberCount: number;
}

export interface LeagueDetail {
  league: LeagueView;
  role: 'admin' | 'member' | null;
  membersCount: number;
  inviteCode: string | null;
}

export abstract class LeagueRepository {
  abstract save(league: League): Promise<void>;
  abstract findById(id: string): Promise<League | null>;
  abstract findByInviteCode(inviteCode: string): Promise<League | null>;
  abstract findPublicLeaguesWithMemberCount(): Promise<PublicLeagueWithMemberCount[]>;
  abstract createWithOwner(league: League, ownerMember: LeagueMember): Promise<void>;
  abstract transferOwnership(league: League, previousAdmin: LeagueMember, newAdmin: LeagueMember): Promise<void>;
}