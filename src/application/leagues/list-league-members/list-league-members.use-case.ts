import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';

@Injectable()
export class ListLeagueMembersUseCase {
  constructor(
    private readonly memberRepo: LeagueMemberRepository,
  ) {}

  async execute(input: { leagueId: string; requesterId: string }): Promise<LeagueMember[]> {
    const requester = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);

    if (!requester || !requester.isActive()) {
      throw new ForbiddenException('You must be a member of this league to view its members');
    }

    return this.memberRepo.findActiveMembersByLeague(input.leagueId);
  }
}