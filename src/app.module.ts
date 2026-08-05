import { Module } from '@nestjs/common';
import { AuthModule } from './infrastructure/http/auth.module';
import { RacesModule } from './infrastructure/http/races.module';
import { LeaguesModule } from './infrastructure/http/leagues.module';
import { PredictionsModule } from './infrastructure/http/predictions.module';


@Module({
  imports: [AuthModule, RacesModule, LeaguesModule, PredictionsModule],
})
export class AppModule {}