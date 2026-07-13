import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueMemberMapper } from '../mappers/league-member.mapper';

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
}