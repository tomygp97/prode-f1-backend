import { PredictionScore } from '../entities/prediction-score.entity';

export interface LeagueRaceScoreEntry {
  userId: string;
  raceId: string;
  round: number;
  totalPoints: number;
}

export abstract class PredictionScoreRepository {
  abstract save(score: PredictionScore): Promise<void>;
  abstract findByPredictionId(predictionId: string): Promise<PredictionScore | null>;
  abstract findByPredictionIds(predictionIds: string[]): Promise<PredictionScore[]>;
  abstract findAllByLeague(leagueId: string): Promise<LeagueRaceScoreEntry[]>;
}