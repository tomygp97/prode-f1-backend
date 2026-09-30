import { Injectable, NotFoundException } from '@nestjs/common';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { PredictionRepository } from '../../../domain/ports/prediction.repository';

@Injectable()
export class GetUserPredictionUseCase {
  constructor(
    private readonly predictionRepo: PredictionRepository,
  ) {}

  async execute(input: {
    leagueId: string;
    raceId: string;
    userId: string;
  }): Promise<Prediction | null> {
    return this.predictionRepo.findByLeagueRaceAndUser(input.leagueId, input.raceId, input.userId);
  }
}