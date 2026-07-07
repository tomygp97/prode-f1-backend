import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { OpenF1Adapter } from '../adapters/openf1.adapter';
import { RacePrismaRepository } from '../database/repositories/race.prisma.repository';
import { SyncCalendarUseCase } from '../../application/sync-races/sync-calendar.use-case';
import { SyncCalendarJob } from '../jobs/sync-calendar.job';

@Module({
    imports: [
        DatabaseModule,
        ScheduleModule.forRoot(),
    ],
    providers: [
        SyncCalendarJob,
        SyncCalendarUseCase,
        OpenF1Adapter,
        {
            provide: 'OfficialResultsProvider',
            useClass: OpenF1Adapter,
        },
        {
            provide: 'RaceRepository',
            useClass: RacePrismaRepository,
        },
    ],
})
export class RacesModule{}