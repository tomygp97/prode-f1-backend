import { Injectable, Inject, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LeaguePrize } from '../../../domain/entities/league-prize.entity';
import type { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import type { LeaguePrizeRepository } from '../../../domain/ports/league-prize.repository';

@Injectable()
export class SetLeaguePrizesUseCase {
  constructor(
    @Inject('LeagueMemberRepository') private readonly memberRepo: LeagueMemberRepository,
    @Inject('LeaguePrizeRepository') private readonly prizeRepo: LeaguePrizeRepository,
  ) {}

  async execute(input: {
    leagueId: string;
    requesterId: string;
    prizes: { position: number; description: string }[];
  }): Promise<LeaguePrize[]> {
    const requester = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);

    if (!requester || !requester.isActive() || requester.role !== 'admin') {
      throw new ForbiddenException('Only the league admin can set prizes');
    }

    const positions = input.prizes.map((p) => p.position);
    const hasDuplicates = new Set(positions).size !== positions.length;
    if (hasDuplicates) {
      throw new BadRequestException('Duplicate prize positions are not allowed');
    }

    const newPrizes = input.prizes.map((p) =>
      LeaguePrize.create({
        id: randomUUID(),
        leagueId: input.leagueId,
        position: p.position,
        description: p.description,
      }),
    );

    await this.prizeRepo.replaceAll(input.leagueId, newPrizes);

    return newPrizes;
  }
}