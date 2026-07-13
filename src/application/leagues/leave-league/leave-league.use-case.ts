import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import type { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';

@Injectable()
export class LeaveLeagueUseCase {
  constructor(
    @Inject('LeagueMemberRepository') private readonly memberRepo: LeagueMemberRepository,
  ) {}

  async execute(input: { leagueId: string; userId: string }): Promise<void> {
    const member = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.userId);

    if (!member || !member.isActive()) {
      throw new NotFoundException('You are not an active member of this league');
    }

    if (member.role === 'admin') {
      throw new ForbiddenException(
        'League admin cannot leave. Transfer ownership first.',
      );
    }

    const leftMember = LeagueMember.create({
      id: member.id,
      leagueId: member.leagueId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      leftAt: new Date(), // 👈 se marca la salida
    });

    await this.memberRepo.save(leftMember);
  }
}