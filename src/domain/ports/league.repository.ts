import { League } from '../entities/league.entity';
import { LeagueMember } from '../entities/league-member.entity';

export interface PublicLeagueWithMemberCount {
  league: League;
  memberCount: number;
}

export interface LeagueRepository {
  save(league: League): Promise<void>;
  findById(id: string): Promise<League | null>;
  findByInviteCode(inviteCode: string): Promise<League | null>;
  findPublicLeaguesWithMemberCount(): Promise<PublicLeagueWithMemberCount[]>;
  createWithOwner(league: League, ownerMember: LeagueMember): Promise<void>;
  transferOwnership(
    league: League,
    previousAdmin: LeagueMember,
    newAdmin: LeagueMember,
  ): Promise<void>;
}