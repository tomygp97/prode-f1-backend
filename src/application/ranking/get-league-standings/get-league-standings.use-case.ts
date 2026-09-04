import { Injectable } from '@nestjs/common';
import { LeagueRankingRepository } from '../../../domain/ports/league-ranking.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { PredictionScoreRepository, LeagueRaceScoreEntry } from '../../../domain/ports/prediction-score.repository';
import { UserRepository } from '../../../domain/ports/user.repository';

export interface StandingEntry {
  rank: number;
  userId: string;
  userName: string;
  totalPoints: number;
  racesCounted: number;
  raceWins: number;
  trend: 'up' | 'down' | 'same';
}

@Injectable()
export class GetLeagueStandingsUseCase {
  constructor(
    private readonly rankingRepo: LeagueRankingRepository,
    private readonly memberRepo: LeagueMemberRepository,
    private readonly scoreRepo: PredictionScoreRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async execute(input: { leagueId: string }): Promise<StandingEntry[]> {
    const [members, rankings, raceScores] = await Promise.all([
      this.memberRepo.findActiveMembersByLeague(input.leagueId),
      this.rankingRepo.findAllByLeague(input.leagueId),
      this.scoreRepo.findAllByLeague(input.leagueId),
    ]);

    const rankingByUserId = new Map(rankings.map((r) => [r.userId, r]));
    const raceWinsByUserId = this.calculateRaceWins(raceScores);
    const previousTotalByUserId = this.calculatePreviousTotals(raceScores);

    const rows = await Promise.all(
      members.map(async (member) => {
        const ranking = rankingByUserId.get(member.userId);
        const user = await this.userRepo.findById(member.userId);
        return {
          userId: member.userId,
          userName: user?.name ?? 'Usuario',
          totalPoints: ranking?.totalPoints ?? 0,
          racesCounted: ranking?.racesCounted ?? 0,
          raceWins: raceWinsByUserId.get(member.userId) ?? 0,
          previousTotalPoints: previousTotalByUserId.get(member.userId) ?? 0,
        };
      }),
    );

    const sorted = [...rows].sort((a, b) => b.totalPoints - a.totalPoints);
    const currentRankByUserId = this.assignCompetitionRanks(sorted, (r) => r.totalPoints);

    const sortedByPrevious = [...rows].sort((a, b) => b.previousTotalPoints - a.previousTotalPoints);
    const previousRankByUserId = this.assignCompetitionRanks(sortedByPrevious, (r) => r.previousTotalPoints);

    return sorted.map((row) => {
      const currentRank = currentRankByUserId.get(row.userId)!;
      const previousRank = previousRankByUserId.get(row.userId)!;
      const trend: 'up' | 'down' | 'same' =
        currentRank < previousRank ? 'up' : currentRank > previousRank ? 'down' : 'same';

      return {
        rank: currentRank,
        userId: row.userId,
        userName: row.userName,
        totalPoints: row.totalPoints,
        racesCounted: row.racesCounted,
        raceWins: row.raceWins,
        trend,
      };
    });
  }

  private assignCompetitionRanks<T extends { userId: string }>(
    sortedRows: T[],
    getValue: (row: T) => number,
  ): Map<string, number> {
    const result = new Map<string, number>();
    let currentRank = 1;
    sortedRows.forEach((row, index) => {
      if (index > 0 && getValue(row) === getValue(sortedRows[index - 1])) {
        // mismo valor que el anterior → mismo rank, no se toca currentRank
      } else {
        currentRank = index + 1;
      }
      result.set(row.userId, currentRank);
    });
    return result;
  }

  private calculateRaceWins(raceScores: LeagueRaceScoreEntry[]): Map<string, number> {
    const scoresByRace = new Map<string, LeagueRaceScoreEntry[]>();
    for (const entry of raceScores) {
      const list = scoresByRace.get(entry.raceId) ?? [];
      list.push(entry);
      scoresByRace.set(entry.raceId, list);
    }

    const wins = new Map<string, number>();
    for (const entries of scoresByRace.values()) {
      const maxPoints = Math.max(...entries.map((e) => e.totalPoints));
      const winners = entries.filter((e) => e.totalPoints === maxPoints);
      for (const winner of winners) {
        wins.set(winner.userId, (wins.get(winner.userId) ?? 0) + 1);
      }
    }
    return wins;
  }

  private calculatePreviousTotals(raceScores: LeagueRaceScoreEntry[]): Map<string, number> {
    if (raceScores.length === 0) return new Map();

    const lastRound = Math.max(...raceScores.map((e) => e.round));

    const totals = new Map<string, number>();
    for (const entry of raceScores) {
      if (entry.round === lastRound) continue; // excluimos la última fecha jugada
      totals.set(entry.userId, (totals.get(entry.userId) ?? 0) + entry.totalPoints);
    }
    return totals;
  }
} 