import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SharedAuthModule } from './shared-auth/shared-auth.module';
import { LeaguesModule } from './leagues.module';
import { RacesModule } from './races.module';
import { PredictionsModule } from './predictions.module';

import { RankingController } from './controllers/ranking.controller';

import { CalculateRaceScoresUseCase } from '../../application/ranking/calculate-race-scores/calculate-race-scores.use-case';
import { CalculateAllPendingScoresUseCase } from '../../application/ranking/calculate-all-pending-scores/calculate-all-pending-scores.use-case';
import { GetLeagueStandingsUseCase } from '../../application/ranking/get-league-standings/get-league-standings.use-case';

import { LeagueRankingRepository } from '../../domain/ports/league-ranking.repository';
import { LeagueRankingPrismaRepository } from '../database/repositories/league-ranking.prisma.repository';
import { PredictionScoreRepository } from '../../domain/ports/prediction-score.repository';
import { PredictionScorePrismaRepository } from '../database/repositories/prediction-score.prisma.repository';

import { CalculateScoresJob } from '../jobs/calculate-scores.job';

@Module({
  imports: [DatabaseModule, SharedAuthModule, LeaguesModule, RacesModule, PredictionsModule],
  controllers: [RankingController],
  providers: [
    CalculateRaceScoresUseCase,
    CalculateAllPendingScoresUseCase,
    GetLeagueStandingsUseCase,
    CalculateScoresJob,
    { provide: LeagueRankingRepository, useClass: LeagueRankingPrismaRepository },
    { provide: PredictionScoreRepository, useClass: PredictionScorePrismaRepository },
  ],
})
export class RankingModule {}