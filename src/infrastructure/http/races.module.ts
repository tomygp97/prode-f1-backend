import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DevController } from '../../dev/dev.controller';
import { SyncCalendarUseCase } from '../../application/sync-races/sync-calendar.use-case';
import { SyncDriversUseCase } from '../../application/sync-races/sync-drivers.use-case';
import { UpdateRaceStatusUseCase } from '../../application/sync-races/update-race-statuses.use-case';
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

@Module({
    imports: [
      DatabaseModule,
      ScheduleModule.forRoot(),
    ],
    controllers: [DevController],
    providers: [
      SyncCalendarJob,
      SyncCalendarUseCase,
      UpdateRaceStatusJob,
      UpdateRaceStatusUseCase,
      SyncDriversUseCase,
      { provide: OfficialResultsProvider, useClass: OpenF1Adapter },
      { provide: RaceRepository, useClass: RacePrismaRepository },
      { provide: TeamRepository, useClass: TeamPrismaRepository },
      { provide: DriverRepository, useClass: DriverPrismaRepository },
    ],
    exports: [RaceRepository], // 👈 nuevo, necesario para que PredictionsModule lo use
  })
export class RacesModule{}