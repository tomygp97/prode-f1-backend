import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueRepository, PublicLeagueWithMemberCount } from '../../../domain/ports/league.repository';
import { LeagueMapper } from '../mappers/league.mapper';
import { LeagueMemberMapper } from '../mappers/league-member.mapper';
import { toLeagueView } from '../../../domain/views/league.view';

@Injectable()
export class LeaguePrismaRepository implements LeagueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(league: League): Promise<void> {
    const data = LeagueMapper.toPersistence(league);
    await this.prisma.league.upsert({
      where: { id: league.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<League | null> {
    const raw = await this.prisma.league.findUnique({ where: { id } });
    return raw ? LeagueMapper.toDomain(raw) : null;
  }

  async findByInviteCode(inviteCode: string): Promise<League | null> {
    const raw = await this.prisma.league.findUnique({ where: { inviteCode } });
    return raw ? LeagueMapper.toDomain(raw) : null;
  }

  async findPublicLeaguesWithMemberCount(): Promise<PublicLeagueWithMemberCount[]> {
    const raws = await this.prisma.league.findMany({
      where: { isPublic: true, deletedAt: null },
      include: {
        _count: {
          select: {
            members: { where: { leftAt: null } },
          },
        },
      },
    });

  return raws.map((raw) => ({
    league: toLeagueView(LeagueMapper.toDomain(raw)),
    memberCount: raw._count.members,
  }));
}

  async createWithOwner(league: League, ownerMember: LeagueMember): Promise<void> {
  const leagueData = LeagueMapper.toPersistence(league);
  const memberData = LeagueMemberMapper.toPersistence(ownerMember);

  await this.prisma.$transaction(async (tx) => {
    await tx.league.create({ data: leagueData });
    await tx.leagueMember.create({ data: memberData });
  });
}

async transferOwnership(
  league: League,
  previousAdmin: LeagueMember,
  newAdmin: LeagueMember,
): Promise<void> {
  const leagueData = LeagueMapper.toPersistence(league);
  const previousAdminData = LeagueMemberMapper.toPersistence(previousAdmin);
  const newAdminData = LeagueMemberMapper.toPersistence(newAdmin);

  await this.prisma.$transaction(async (tx) => {
    await tx.league.update({ where: { id: league.id }, data: { ownerId: leagueData.ownerId } });
    await tx.leagueMember.update({ where: { id: previousAdmin.id }, data: { role: previousAdminData.role } });
    await tx.leagueMember.update({ where: { id: newAdmin.id }, data: { role: newAdminData.role } });
  });
}

}

