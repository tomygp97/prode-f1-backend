import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { League } from '../../../domain/entities/league.entity';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';

@Injectable()
export class SetLeaguePredictionSlotsUseCase {
  constructor(
    private readonly leagueRepo: LeagueRepository,
    private readonly memberRepo: LeagueMemberRepository,
  ) {}

  async execute(input: {
    leagueId: string;
    requesterId: string;
    predictionSlots: number;
  }): Promise<League> {
    const league = await this.leagueRepo.findById(input.leagueId);
    if (!league) {
      throw new NotFoundException('League not found');
    }

    const requester = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);
    if (!requester || !requester.isActive() || requester.role !== 'admin') {
      throw new ForbiddenException('Only the league admin can change prediction slots');
    }

    const updatedLeague = League.create({
      id: league.id,
      name: league.name,
      ownerId: league.ownerId,
      inviteCode: league.inviteCode,
      isPublic: league.isPublic,
      predictionSlots: input.predictionSlots,
      seasonId: league.seasonId,
      trackedDriverId: league.trackedDriverId,
    });

    await this.leagueRepo.save(updatedLeague);

    return updatedLeague;
  }
}