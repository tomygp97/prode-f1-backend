import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SharedAuthModule } from './shared-auth/shared-auth.module';
import { LeaguesModule } from './leagues.module';
import { RacesModule } from './races.module';

import { PredictionController } from './controllers/prediction.controller';

import { SubmitPredictionUseCase } from '../../application/predictions/submit-prediction/submit-prediction.use-case';
import { GetUserPredictionUseCase } from '../../application/predictions/get-user-prediction/get-user-prediction.use-case';
import { GetUserPredictionScoreUseCase } from '../../application/predictions/get-user-prediction-score/get-user-prediction-score.use-case';
import { ListPredictionsForRaceUseCase } from '../../application/predictions/list-predictions-for-race/list-predictions-for-race.use-case';

import { PredictionRepository } from '../../domain/ports/prediction.repository';
import { PredictionPrismaRepository } from '../database/repositories/prediction.prisma.repository';
import { PredictionScoreRepository } from '../../domain/ports/prediction-score.repository';
import { PredictionScorePrismaRepository } from '../database/repositories/prediction-score.prisma.repository';

@Module({
  imports: [DatabaseModule, SharedAuthModule, LeaguesModule, RacesModule], // 👈 importa los dos módulos ajenos
  controllers: [PredictionController],
  providers: [
    SubmitPredictionUseCase,
    GetUserPredictionUseCase,
    GetUserPredictionScoreUseCase,
    ListPredictionsForRaceUseCase,
    { provide: PredictionRepository, useClass: PredictionPrismaRepository },
    { provide: PredictionScoreRepository, useClass: PredictionScorePrismaRepository },  
  ],
  exports: [PredictionRepository],
})
export class PredictionsModule {}