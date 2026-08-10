import { Module } from '@nestjs/common';
import { AuthModule } from './infrastructure/http/auth.module';
import { RacesModule } from './infrastructure/http/races.module';
import { LeaguesModule } from './infrastructure/http/leagues.module';
import { PredictionsModule } from './infrastructure/http/predictions.module';
import { RankingModule } from './infrastructure/http/ranking.module';
import { DriversModule } from './infrastructure/http/drivers.module';

@Module({
  imports: [AuthModule, LeaguesModule, DriversModule, RacesModule, PredictionsModule, RankingModule],
})
export class AppModule {}