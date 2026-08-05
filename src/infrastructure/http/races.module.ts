import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DevController } from '../../dev/dev.controller';
import { SyncCalendarUseCase } from '../../application/sync-races/sync-calendar.use-case';
import { SyncDriversUseCase } from '../../application/sync-races/sync-drivers.use-case';
import { UpdateRaceStatusUseCase } from '../../application/sync-races/update-race-statuses.use-case';
import { SyncRaceResultsUseCase } from '../../application/sync-races/sync-race-results.use-case';
import { OfficialResultsProvider } from '../../domain/ports/official-results.provider';
import { RaceRepository } from '../../domain/ports/race.repository';
import { OpenF1Adapter } from '../adapters/openf1.adapter';
import { DatabaseModule } from '../database/database.module';
import { RacePrismaRepository } from '../database/repositories/race.prisma.repository';
import { SyncCalendarJob } from '../jobs/sync-calendar.job';
import { UpdateRaceStatusJob } from '../jobs/update-race-statuses.job';
import { TeamRepository } from '../../domain/ports/team.repository';
import { TeamPrismaRepository } from '../database/repositories/team.prisma.repository';
import { DriverRepository } from '../../domain/ports/driver.repository';
import { DriverPrismaRepository } from '../database/repositories/driver.prisma.repository';
import { RaceResultRepository } from '../../domain/ports/race-result.repository';
import { RaceResultPrismaRepository } from '../database/repositories/race-result.prisma.repository';
import { RaceDriverResultPrismaRepository } from '../database/repositories/race-driver-result.prisma.repository';
import { RaceDriverResultRepository } from '../../domain/ports/race-driver-result.repository';
import { SyncAllRaceResultsUseCase } from '../../application/sync-races/sync-all-race-results.use-case';
import { SyncRaceResultsJob } from '../jobs/sync-race-results.job';
import { RaceController } from './controllers/race.controller';
import { GetRacesUseCase } from '../../application/races/get-races/get-races.use-case';
import { GetRaceByIdUseCase } from '../../application/races/get-race/get-race-by-id.use-case';
import { GetNextRaceUseCase } from '../../application/races/get-next-race/get-next-race.use-case';
import { GetRaceResultsUseCase } from '../../application/races/get-race-results/get-race-results.use-case';

@Module({
    imports: [
      DatabaseModule,
      ScheduleModule.forRoot(),
    ],
    controllers: [RaceController, DevController],
    providers: [
      SyncCalendarJob,
      SyncCalendarUseCase,
      UpdateRaceStatusJob,
      UpdateRaceStatusUseCase,
      SyncDriversUseCase,
      SyncRaceResultsUseCase,
      SyncAllRaceResultsUseCase,
      SyncRaceResultsJob,
      GetRacesUseCase,
      GetRaceByIdUseCase,
      GetNextRaceUseCase,
      GetRaceResultsUseCase,
      { provide: OfficialResultsProvider, useClass: OpenF1Adapter },
      { provide: RaceRepository, useClass: RacePrismaRepository },
      { provide: TeamRepository, useClass: TeamPrismaRepository },
      { provide: DriverRepository, useClass: DriverPrismaRepository },
      { provide: RaceResultRepository, useClass: RaceResultPrismaRepository },
      { provide: RaceDriverResultRepository, useClass: RaceDriverResultPrismaRepository },
      { provide: RaceRepository, useClass: RacePrismaRepository },
    ],
    exports: [RaceRepository],
  })
export class RacesModule{}