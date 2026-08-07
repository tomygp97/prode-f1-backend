import { Injectable, Logger } from '@nestjs/common';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { RaceStatus } from '../../../domain/enums/race-status.enum';
import { CalculateRaceScoresUseCase } from '../calculate-race-scores/calculate-race-scores.use-case';

@Injectable()
export class CalculateAllPendingScoresUseCase {
  private readonly logger = new Logger(CalculateAllPendingScoresUseCase.name);

  constructor(
    private readonly raceRepo: RaceRepository,
    private readonly calculateRaceScores: CalculateRaceScoresUseCase,
  ) {}

  async execute(): Promise<void> {
    const races = await this.raceRepo.findRacesPendingScoreCalculation(); 

    for (const race of races) {
      try {
        await this.calculateRaceScores.execute(race.id);
      } catch (error) {
        this.logger.error(`Failed to calculate scores for race ${race.id}`, error);
      }
    }

    this.logger.log(`Processed ${races.length} races with synced results`);
  }
}