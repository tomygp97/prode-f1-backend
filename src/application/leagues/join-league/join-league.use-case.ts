import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import type { LeagueRepository } from '../../../domain/ports/league.repository';
import type { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { InviteCodeGenerator } from '../../../domain/ports/invite-code-generator';

@Injectable()
export class JoinLeagueUseCase{
    constructor(
        @Inject('LeagueRepository') private readonly leagueRepo: LeagueRepository,
        @Inject('LeagueMemberRepository') private readonly memberRepo: LeagueMemberRepository,
    ) {}

    async execute(input: { inviteCode: string; userId: string }): Promise<LeagueMember> {
    const league = await this.leagueRepo.findByInviteCode(input.inviteCode);
    if (!league) {
        throw new NotFoundException('Invalid invite code');
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
        role: 'member'
    })
    await this.memberRepo.save(newMember);
    return newMember;
    }
}






