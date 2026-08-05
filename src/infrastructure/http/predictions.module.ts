import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SharedAuthModule } from './shared-auth/shared-auth.module';
import { LeaguesModule } from './leagues.module';
import { RacesModule } from './races.module';

import { PredictionController } from './controllers/prediction.controller';

import { SubmitPredictionUseCase } from '../../application/predictions/submit-prediction/submit-prediction.use-case';
import { GetUserPredictionUseCase } from '../../application/predictions/get-user-prediction/get-user-prediction.use-case';
import { ListPredictionsForRaceUseCase } from '../../application/predictions/list-predictions-for-race/list-predictions-for-race.use-case';

import { PredictionRepository } from '../../domain/ports/prediction.repository';
import { PredictionPrismaRepository } from '../database/repositories/prediction.prisma.repository';

@Module({
  imports: [DatabaseModule, SharedAuthModule, LeaguesModule, RacesModule], // 👈 importa los dos módulos ajenos
  controllers: [PredictionController],
  providers: [
    SubmitPredictionUseCase,
    GetUserPredictionUseCase,
    ListPredictionsForRaceUseCase,
    { provide: PredictionRepository, useClass: PredictionPrismaRepository },
  ],
  exports: [PredictionRepository],
})
export class PredictionsModule {}