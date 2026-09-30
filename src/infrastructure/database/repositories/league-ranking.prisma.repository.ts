import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeagueRanking } from '../../../domain/entities/league-ranking.entity';
import { LeagueRankingRepository } from '../../../domain/ports/league-ranking.repository';
import { LeagueRankingMapper } from '../mappers/league-ranking.mapper';

@Injectable()
export class LeagueRankingPrismaRepository implements LeagueRankingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(ranking: LeagueRanking): Promise<void> {
    const data = LeagueRankingMapper.toPersistence(ranking);
    await this.prisma.leagueRanking.upsert({
      where: { id: ranking.id },
      create: data,
      update: data,
    });
  }

  async findByLeagueAndUser(leagueId: string, userId: string): Promise<LeagueRanking | null> {
    const raw = await this.prisma.leagueRanking.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    return raw ? LeagueRankingMapper.toDomain(raw) : null;
  }

  async findAllByLeague(leagueId: string): Promise<LeagueRanking[]> {
    const raws = await this.prisma.leagueRanking.findMany({
      where: { leagueId },
    });
    return raws.map(LeagueRankingMapper.toDomain);
  }
}