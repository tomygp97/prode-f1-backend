import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SeasonController } from './controllers/season.controller';
import { GetCurrentSeasonUseCase } from '../../application/seasons/get-current-season/get-current-season.use-case';
import { SeasonRepository } from '../../domain/ports/season.repository';
import { SeasonPrismaRepository } from '../database/repositories/season.prisma.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [SeasonController],
  providers: [
    GetCurrentSeasonUseCase,
    { provide: SeasonRepository, useClass: SeasonPrismaRepository },
  ],
})
export class SeasonsModule {}