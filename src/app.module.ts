import { Module } from '@nestjs/common';
import { AuthModule } from './infrastructure/http/auth.module';


@Module({
  imports: [AuthModule],
})
export class AppModule {}
