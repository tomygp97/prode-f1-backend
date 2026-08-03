import { Prediction } from '../../../domain/entities/prediction.entity';
import { Prediction as PrismaPrediction } from '@prisma/client';

export class PredictionMapper {
  static toDomain(raw: PrismaPrediction): Prediction {
    return Prediction.create({
      id: raw.id,
      userId: raw.userId,
      leagueId: raw.leagueId,
      raceId: raw.raceId,
      predictedOrder: raw.predictedOrder as string[],
      trackedDriverPosition: raw.trackedDriverPosition,
      safetyCar: raw.safetyCar,
      dnfCount: raw.dnfCount,
    });
  }

  static toPersistence(prediction: Prediction) {
    return {
      id: prediction.id,
      userId: prediction.userId,
      leagueId: prediction.leagueId,
      raceId: prediction.raceId,
      predictedOrder: prediction.predictedOrder,
      trackedDriverPosition: prediction.trackedDriverPosition,
      safetyCar: prediction.safetyCar,
      dnfCount: prediction.dnfCount,
    };
  }
}