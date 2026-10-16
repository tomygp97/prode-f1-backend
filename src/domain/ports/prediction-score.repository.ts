import { PredictionScore } from '../entities/prediction-score.entity';

export interface LeagueRaceScoreEntry {
  userId: string;
  raceId: string;
  round: number;
  totalPoints: number;
}

export abstract class PredictionScoreRepository {
  /** Guarda los puntajes de una carrera en una sola transacción; reemplaza el de una predicción si ya existía. */
  abstract saveAll(scores: PredictionScore[]): Promise<void>;
  abstract findByPredictionId(predictionId: string): Promise<PredictionScore | null>;
  abstract findByPredictionIds(predictionIds: string[]): Promise<PredictionScore[]>;
  abstract findAllByLeague(leagueId: string): Promise<LeagueRaceScoreEntry[]>;
}