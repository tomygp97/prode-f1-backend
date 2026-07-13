import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LeaguePrize } from '../../../domain/entities/league-prize.entity';
import type { LeagueRepository } from '../../../domain/ports/league.repository';
import type { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import type { LeaguePrizeRepository } from '../../../domain/ports/league-prize.repository';

@Injectable()
export class GetLeaguePrizesUseCase {
  constructor(
    @Inject('LeagueRepository') private readonly leagueRepo: LeagueRepository,
    @Inject('LeagueMemberRepository') private readonly memberRepo: LeagueMemberRepository,
    @Inject('LeaguePrizeRepository') private readonly prizeRepo: LeaguePrizeRepository,
  ) {}

  async execute(input: { leagueId: string; requesterId: string }): Promise<LeaguePrize[]> {
    const league = await this.leagueRepo.findById(input.leagueId);
    if (!league) {
      throw new NotFoundException('League not found');
    }

    if (!league.isPublic) {
      const requester = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);
      if (!requester || !requester.isActive()) {
        throw new ForbiddenException('You must be a member of this league to view its prizes');
      }
    }

    return this.prizeRepo.findByLeagueId(input.leagueId);
  }
}