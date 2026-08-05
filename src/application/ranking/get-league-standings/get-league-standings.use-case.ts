import { Injectable } from '@nestjs/common';
import { LeagueRankingRepository } from '../../../domain/ports/league-ranking.repository';
import { LeagueRanking } from '../../../domain/entities/league-ranking.entity';

export interface StandingEntry {
  rank: number;
  ranking: LeagueRanking;
}

@Injectable()
export class GetLeagueStandingsUseCase {
  constructor(
    private readonly rankingRepo: LeagueRankingRepository,
  ) {}

  async execute(input: { leagueId: string }): Promise<StandingEntry[]> {
    const rankings = await this.rankingRepo.findAllByLeague(input.leagueId);

    const sorted = [...rankings].sort((a, b) => b.totalPoints - a.totalPoints);

    let currentRank = 1;
    return sorted.map((ranking, index) => {
      if (index > 0 && ranking.totalPoints === sorted[index - 1].totalPoints) {
        // mismo puntaje que el anterior → mismo rank
      } else {
        currentRank = index + 1;
      }
      return { rank: currentRank, ranking };
    });
  }
}