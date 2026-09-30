import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';

@Injectable()
export class JoinPublicLeagueUseCase {
  constructor(
    private readonly leagueRepo: LeagueRepository,
    private readonly memberRepo: LeagueMemberRepository,
  ) {}

  async execute(input: { leagueId: string; userId: string }): Promise<LeagueMember> {
    const league = await this.leagueRepo.findById(input.leagueId);
    if (!league) {
      throw new NotFoundException('League not found');
    }

    if (!league.isPublic) {
      throw new BadRequestException('This league is private, you need an invite code to join');
    }

    const existingMember = await this.memberRepo.findByLeagueAndUser(league.id, input.userId);

    if (existingMember && existingMember.isActive()) {
      throw new ConflictException('User is already a member of this league');
    }

    if (existingMember && !existingMember.isActive()) {
      const reactivated = LeagueMember.create({
        id: existingMember.id,
        leagueId: existingMember.leagueId,
        userId: existingMember.userId,
        role: existingMember.role,
        joinedAt: existingMember.joinedAt,
        leftAt: null,
      });
      await this.memberRepo.save(reactivated);
      return reactivated;
    }

    const newMember = LeagueMember.create({
      id: randomUUID(),
      leagueId: league.id,
      userId: input.userId,
      role: 'member',
    });
    await this.memberRepo.save(newMember);
    return newMember;
  }
}