import { Module } from '@nestjs/common';
import { AuthModule } from './infrastructure/http/auth.module';
import { LeaguesModule } from './infrastructure/http/leagues.module';

@Module({
  imports: [AuthModule, LeaguesModule],
})
export class AppModule {}