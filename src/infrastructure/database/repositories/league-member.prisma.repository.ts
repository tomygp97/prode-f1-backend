import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueMemberRepository, UserLeagueMembership } from '../../../domain/ports/league-member.repository';
import { LeagueMemberMapper } from '../mappers/league-member.mapper';
import { LeagueMapper } from '../mappers/league.mapper';
import { toLeagueView } from '../../../domain/views/league.view';

@Injectable()
export class LeagueMemberPrismaRepository implements LeagueMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(member: LeagueMember): Promise<void> {
    const data = LeagueMemberMapper.toPersistence(member);
    await this.prisma.leagueMember.upsert({
      where: { id: member.id },
      create: data,
      update: data,
    });
  }

  async findByLeagueAndUser(leagueId: string, userId: string): Promise<LeagueMember | null> {
    const raw = await this.prisma.leagueMember.findFirst({
      where: { leagueId, userId },
    });
    return raw ? LeagueMemberMapper.toDomain(raw) : null;
  }

  async findActiveMembersByLeague(leagueId: string): Promise<LeagueMember[]> {
    const raws = await this.prisma.leagueMember.findMany({
      where: { leagueId, leftAt: null },
    });
    return raws.map(LeagueMemberMapper.toDomain);
  }

  async findActiveLeaguesByUser(userId: string): Promise<UserLeagueMembership[]> {
    const raws = await this.prisma.leagueMember.findMany({
      where: {
        userId,
        leftAt: null,
        league: { deletedAt: null },
      },
      include: {
        league: {
          include: {
            _count: {
              select: {
                members: { where: { leftAt: null } },
              },
            },
          },
        },
      },
    });

    return raws.map((raw) => ({
      league: toLeagueView(LeagueMapper.toDomain(raw.league)),
      role: raw.role as 'admin' | 'member',
      joinedAt: raw.joinedAt,
      membersCount: raw.league._count.members,
      inviteCode: raw.league.inviteCode,
    }));
  }
}