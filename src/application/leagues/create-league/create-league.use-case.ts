import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import type { LeagueRepository } from '../../../domain/ports/league.repository';
import type { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import type { InviteCodeGenerator } from '../../../domain/ports/invite-code-generator';

@Injectable()
export class CreateLeagueUseCase {
  constructor(
    @Inject('LeagueRepository') private readonly leagueRepo: LeagueRepository,
    @Inject('LeagueMemberRepository') private readonly memberRepo: LeagueMemberRepository,
    @Inject('InviteCodeGenerator') private readonly codeGen: InviteCodeGenerator,
  ) {}

  async execute(input: {
    name: string;
    ownerId: string;
    isPublic: boolean;
    seasonId: string;
    trackedDriverId?: string | null;
  }): Promise<League> {
    const league = League.create({
      id: randomUUID(),
      name: input.name,
      ownerId: input.ownerId,
      inviteCode: this.codeGen.generate(),
      isPublic: input.isPublic,
      seasonId: input.seasonId,
      trackedDriverId: input.trackedDriverId ?? null,
    });


    const ownerMember = LeagueMember.create({
      id: randomUUID(),
      leagueId: league.id,
      userId: input.ownerId,
      role: 'admin',
    });

    await this.leagueRepo.createWithOwner(league, ownerMember);

    return league;
  }
}