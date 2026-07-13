import { Injectable, Inject, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import type { LeagueRepository } from '../../../domain/ports/league.repository';
import type { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';

@Injectable()
export class TransferLeagueOwnershipUseCase {
  constructor(
    @Inject('LeagueRepository') private readonly leagueRepo: LeagueRepository,
    @Inject('LeagueMemberRepository') private readonly memberRepo: LeagueMemberRepository,
  ) {}

  async execute(input: {
    leagueId: string;
    requesterId: string;
    newOwnerId: string;
  }): Promise<void> {
    if (input.requesterId === input.newOwnerId) {
      throw new BadRequestException('You are already the owner of this league');
    }

    const league = await this.leagueRepo.findById(input.leagueId);
    if (!league) {
      throw new NotFoundException('League not found');
    }

    const currentAdminMember = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);
    if (!currentAdminMember || !currentAdminMember.isActive() || currentAdminMember.role !== 'admin') {
      throw new ForbiddenException('Only the current league admin can transfer ownership');
    }

    const newOwnerMember = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.newOwnerId);
    if (!newOwnerMember || !newOwnerMember.isActive()) {
      throw new BadRequestException('New owner must be an active member of this league');
    }

    const updatedLeague = League.create({
      id: league.id,
      name: league.name,
      ownerId: input.newOwnerId, // 👈 cambia el dueño
      inviteCode: league.inviteCode,
      isPublic: league.isPublic,
      seasonId: league.seasonId,
      trackedDriverId: league.trackedDriverId,
    });

    const demotedAdmin = LeagueMember.create({
      id: currentAdminMember.id,
      leagueId: currentAdminMember.leagueId,
      userId: currentAdminMember.userId,
      role: 'member', // 👈 baja de rango
      joinedAt: currentAdminMember.joinedAt,
      leftAt: currentAdminMember.leftAt,
    });

    const promotedOwner = LeagueMember.create({
      id: newOwnerMember.id,
      leagueId: newOwnerMember.leagueId,
      userId: newOwnerMember.userId,
      role: 'admin', // 👈 sube de rango
      joinedAt: newOwnerMember.joinedAt,
      leftAt: newOwnerMember.leftAt,
    });

    await this.leagueRepo.transferOwnership(updatedLeague, demotedAdmin, promotedOwner);
  }
}