import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaguePrize } from '../../../domain/entities/league-prize.entity';
import type { LeaguePrizeRepository } from '../../../domain/ports/league-prize.repository';
import { LeaguePrizeMapper } from '../mappers/league-prize.mapper';

@Injectable()
export class LeaguePrizePrismaRepository implements LeaguePrizeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async replaceAll(leagueId: string, prizes: LeaguePrize[]): Promise<void> {
  const data = prizes.map(LeaguePrizeMapper.toPersistence);

  await this.prisma.$transaction(async (tx) => {
    await tx.leaguePrize.deleteMany({ where: { leagueId } });
    await tx.leaguePrize.createMany({ data });
  });
}
  async findByLeagueId(leagueId: string): Promise<LeaguePrize[]> {
    const raws = await this.prisma.leaguePrize.findMany({
      where: { leagueId },
      orderBy: { position: 'asc' },
    });
    return raws.map(LeaguePrizeMapper.toDomain);
  }
}