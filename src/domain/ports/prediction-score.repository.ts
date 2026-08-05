import { PredictionScore } from '../entities/prediction-score.entity';

export abstract class PredictionScoreRepository {
  abstract save(score: PredictionScore): Promise<void>;
  abstract findByPredictionId(predictionId: string): Promise<PredictionScore | null>;
}