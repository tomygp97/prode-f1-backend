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
      predictedPoleDriverId: raw.predictedPoleDriverId,
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
      predictedPoleDriverId: prediction.predictedPoleDriverId,
      trackedDriverPosition: prediction.trackedDriverPosition,
      safetyCar: prediction.safetyCar,
      dnfCount: prediction.dnfCount,
    };
  }
}