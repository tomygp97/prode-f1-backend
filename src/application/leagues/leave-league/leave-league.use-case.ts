import { Injectable, NotFoundException } from '@nestjs/common';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueRepository } from '../../../domain/ports/league.repository';

export interface LeaveLeagueResult {
  /** Nuevo admin cuando el que salió era el admin (el miembro activo más antiguo). */
  newAdminUserId: string | null;
  /** true si el admin era el único miembro: la liga se dio de baja. */
  leagueDeleted: boolean;
}

@Injectable()
export class LeaveLeagueUseCase {
  constructor(
    private readonly memberRepo: LeagueMemberRepository,
    private readonly leagueRepo: LeagueRepository,
  ) {}

  async execute(input: { leagueId: string; userId: string }): Promise<LeaveLeagueResult> {
    const member = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.userId);

    if (!member || !member.isActive()) {
      throw new NotFoundException('You are not an active member of this league');
    }

    // Sale como `member`: si vuelve a unirse, la reactivación no le devuelve el admin
    const leftMember = LeagueMember.create({
      id: member.id,
      leagueId: member.leagueId,
      userId: member.userId,
      role: 'member',
      joinedAt: member.joinedAt,
      leftAt: new Date(),
    });

    if (member.role !== 'admin') {
      await this.memberRepo.save(leftMember);
      return { newAdminUserId: null, leagueDeleted: false };
    }

    // El admin se va: la liga pasa al miembro activo más antiguo
    const successor = (await this.memberRepo.findActiveMembersByLeague(input.leagueId))
      .filter((m) => m.userId !== member.userId)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0];

    const newAdmin = successor
      ? LeagueMember.create({
          id: successor.id,
          leagueId: successor.leagueId,
          userId: successor.userId,
          role: 'admin',
          joinedAt: successor.joinedAt,
          leftAt: null,
        })
      : null;

    await this.leagueRepo.leaveAsAdmin(leftMember, newAdmin);

    return { newAdminUserId: newAdmin?.userId ?? null, leagueDeleted: newAdmin === null };
  }
}
