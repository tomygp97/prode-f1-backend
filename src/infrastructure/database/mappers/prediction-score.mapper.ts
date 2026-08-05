import { PredictionScore, PredictionScoreBreakdown } from '../../../domain/entities/prediction-score.entity';
import { PredictionScore as PrismaPredictionScore, Prisma } from '@prisma/client';

export class PredictionScoreMapper {
  static toDomain(raw: PrismaPredictionScore): PredictionScore {
    return PredictionScore.create({
      id: raw.id,
      predictionId: raw.predictionId,
      pointsBreakdown: raw.pointsBreakdown as unknown as PredictionScoreBreakdown,
      calculatedAt: raw.calculatedAt,
    });
  }

  static toPersistence(score: PredictionScore) {
    return {
      id: score.id,
      predictionId: score.predictionId,
      pointsBreakdown: score.pointsBreakdown as unknown as Prisma.InputJsonValue,
      totalPoints: score.totalPoints,
      calculatedAt: score.calculatedAt,
    };
  }
}