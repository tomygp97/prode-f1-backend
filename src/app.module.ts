import { Module } from '@nestjs/common';
import { AuthModule } from './infrastructure/http/auth.module';
import { RacesModule } from './infrastructure/http/races.module';


@Module({
  imports: [AuthModule, RacesModule],
})
export class AppModule {}
