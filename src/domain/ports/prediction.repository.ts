import { Prediction } from '../entities/prediction.entity';

export abstract class PredictionRepository {
  abstract save(prediction: Prediction): Promise<void>;
  abstract findByLeagueRaceAndUser(leagueId: string, raceId: string, userId: string): Promise<Prediction | null>;
  abstract findAllByLeagueAndRace(leagueId: string, raceId: string): Promise<Prediction[]>;
  abstract findAllByRaceId(raceId: string): Promise<Prediction[]>;
}