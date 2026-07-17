import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { OpenF1Adapter } from '../adapters/openf1.adapter';
import { RacePrismaRepository } from '../database/repositories/race.prisma.repository';
import { SyncCalendarUseCase } from '../../application/sync-races/sync-calendar.use-case';
import { SyncCalendarJob } from '../jobs/sync-calendar.job';
import { OfficialResultsProvider } from '../../domain/ports/official-results.provider';
import { RaceRepository } from '../../domain/ports/race.repository';
import { UpdateRaceStatusJob } from '../jobs/update-race-statuses.job';
import { UpdateRaceStatusUseCase } from '../../application/sync-races/update-race-statuses.use-case';

@Module({
    imports: [
      DatabaseModule,
      ScheduleModule.forRoot(),
    ],
    providers: [
      SyncCalendarJob,
      SyncCalendarUseCase,
      UpdateRaceStatusJob,
      UpdateRaceStatusUseCase,
      {
        provide: OfficialResultsProvider,
        useClass: OpenF1Adapter,
      },
      {
        provide: RaceRepository,
        useClass: RacePrismaRepository,
      },
    ],
  })
export class RacesModule{}