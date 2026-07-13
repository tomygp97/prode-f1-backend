import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueMember as PrismaLeagueMember } from '@prisma/client';

export class LeagueMemberMapper {
  static toDomain(raw: PrismaLeagueMember): LeagueMember {
    return LeagueMember.create({
      id: raw.id,
      leagueId: raw.leagueId,
      userId: raw.userId,
      role: raw.role as 'admin' | 'member',
      joinedAt: raw.joinedAt,
      leftAt: raw.leftAt,
    });
  }

  static toPersistence(member: LeagueMember) {
    return {
      id: member.id,
      leagueId: member.leagueId,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      leftAt: member.leftAt,
    };
  }
}