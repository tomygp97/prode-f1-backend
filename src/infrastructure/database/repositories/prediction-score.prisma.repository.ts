import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PredictionScore } from '../../../domain/entities/prediction-score.entity';
import { PredictionScoreRepository } from '../../../domain/ports/prediction-score.repository';
import { PredictionScoreMapper } from '../mappers/prediction-score.mapper';
import { LeagueRaceScoreEntry } from '../../../domain/ports/prediction-score.repository';

@Injectable()
export class PredictionScorePrismaRepository implements PredictionScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveAll(scores: PredictionScore[]): Promise<void> {
    if (scores.length === 0) return;
    await this.prisma.$transaction(
      scores.map((score) => {
        const data = PredictionScoreMapper.toPersistence(score);
        return this.prisma.predictionScore.upsert({
          where: { predictionId: score.predictionId },
          create: data,
          update: {
            pointsBreakdown: data.pointsBreakdown,
            totalPoints: data.totalPoints,
            calculatedAt: data.calculatedAt,
          },
        });
      }),
    );
  }

  async findByPredictionId(predictionId: string): Promise<PredictionScore | null> {
    const raw = await this.prisma.predictionScore.findUnique({
      where: { predictionId },
    });
    return raw ? PredictionScoreMapper.toDomain(raw) : null;
  }

  async findByPredictionIds(predictionIds: string[]): Promise<PredictionScore[]> {
    if (predictionIds.length === 0) return [];
    const rows = await this.prisma.predictionScore.findMany({
      where: { predictionId: { in: predictionIds } },
    });
    return rows.map((row) => PredictionScoreMapper.toDomain(row));
  }

  async findAllByLeague(leagueId: string): Promise<LeagueRaceScoreEntry[]> {
     const rows = await this.prisma.predictionScore.findMany({
      where: {
        prediction: { leagueId },
      },
      select: {
        totalPoints: true,
        prediction: {
          select: {
            userId: true,
            raceId: true,
            race: { select: { round: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      userId: row.prediction.userId,
      raceId: row.prediction.raceId,
      round: row.prediction.race.round,
      totalPoints: row.totalPoints,
    }));
  }
}