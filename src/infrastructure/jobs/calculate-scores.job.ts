import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CalculateAllPendingScoresUseCase } from '../../application/ranking/calculate-all-pending-scores/calculate-all-pending-scores.use-case';

@Injectable()
export class CalculateScoresJob {
  private readonly logger = new Logger(CalculateScoresJob.name);

  constructor(private readonly calculateAllPendingScores: CalculateAllPendingScoresUseCase) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handle() {
    this.logger.log('Starting score calculation...');
    try {
      await this.calculateAllPendingScores.execute();
    } catch (error) {
      this.logger.error('Score calculation failed', error);
    }
  }
}