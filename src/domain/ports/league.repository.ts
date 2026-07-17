import { League } from '../entities/league.entity';
import { LeagueMember } from '../entities/league-member.entity';

export interface PublicLeagueWithMemberCount {
  league: League;
  memberCount: number;
}

export abstract class LeagueRepository {
  abstract save(league: League): Promise<void>;
  abstract findById(id: string): Promise<League | null>;
  abstract findByInviteCode(inviteCode: string): Promise<League | null>;
  abstract findPublicLeaguesWithMemberCount(): Promise<PublicLeagueWithMemberCount[]>;
  abstract createWithOwner(league: League, ownerMember: LeagueMember): Promise<void>;
  abstract transferOwnership(league: League, previousAdmin: LeagueMember, newAdmin: LeagueMember): Promise<void>;
}