import { Injectable, ForbiddenException } from '@nestjs/common';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { UserRepository } from '../../../domain/ports/user.repository';

export interface LeagueMemberView {
  userId: string;
  name: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

@Injectable()
export class ListLeagueMembersUseCase {
  constructor(
    private readonly memberRepo: LeagueMemberRepository,
    private readonly userRepo: UserRepository,
  ) {}

  /** Miembros activos ordenados por antigüedad (el primero no-admin es quien heredaría la liga). */
  async execute(input: { leagueId: string; requesterId: string }): Promise<LeagueMemberView[]> {
    const requester = await this.memberRepo.findByLeagueAndUser(input.leagueId, input.requesterId);

    if (!requester || !requester.isActive()) {
      throw new ForbiddenException('You must be a member of this league to view its members');
    }

    const members = await this.memberRepo.findActiveMembersByLeague(input.leagueId);
    const users = await this.userRepo.findByIds(members.map((member) => member.userId));
    const nameById = new Map(users.map((user) => [user.id, user.name]));

    return members
      .map((member) => ({
        userId: member.userId,
        name: nameById.get(member.userId) ?? 'Usuario',
        role: member.role,
        joinedAt: member.joinedAt,
      }))
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }
}
