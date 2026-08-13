import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SharedAuthModule } from './shared-auth/shared-auth.module';

import { LeagueController } from './controllers/league.controller';

// Use cases
import { CreateLeagueUseCase } from '../../application/leagues/create-league/create-league.use-case';
import { JoinLeagueUseCase } from '../../application/leagues/join-league/join-league.use-case';
import { LeaveLeagueUseCase } from '../../application/leagues/leave-league/leave-league.use-case';
import { ListPublicLeaguesUseCase } from '../../application/leagues/list-public-leagues/list-public-leagues.use-case';
import { ListLeagueMembersUseCase } from '../../application/leagues/list-league-members/list-league-members.use-case';
import { SetLeaguePrizesUseCase } from '../../application/leagues/set-league-prizes/set-league-prizes.use-case';
import { GetLeaguePrizesUseCase } from '../../application/leagues/get-league-prizes/get-league-prizes.use-case';
import { TransferLeagueOwnershipUseCase } from '../../application/leagues/transfer-league-ownership/transfer-league-ownership.use-case';
import { SetLeaguePredictionSlotsUseCase } from '../../application/leagues/set-league-prediction-slots/set-league-prediction-slots.use-case';
import { JoinPublicLeagueUseCase } from '../../application/leagues/join-public-league/join-public-league.use-case';
import { ListUserLeaguesUseCase } from '../../application/leagues/list-user-leagues/list-user-leagues.use-case';
import { GetLeagueByIdUseCase } from '../../application/leagues/get-league-by-id/get-league-by-id.use-case';


// Puertos (ahora clases abstractas, necesitamos importarlas como valores reales)
import { LeagueRepository } from '../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../domain/ports/league-member.repository';
import { LeaguePrizeRepository } from '../../domain/ports/league-prize.repository';
import { InviteCodeGenerator } from '../../domain/ports/invite-code-generator';

// Repositorios Prisma (implementaciones)
import { LeaguePrismaRepository } from '../database/repositories/league.prisma.repository';
import { LeagueMemberPrismaRepository } from '../database/repositories/league-member.prisma.repository';
import { LeaguePrizePrismaRepository } from '../database/repositories/league-prize.prisma.repository';

// Otros servicios de infraestructura
import { NanoIdInviteCodeGenerator } from '../services/invite-code.generator';

@Module({
  imports: [DatabaseModule, SharedAuthModule],
  controllers: [LeagueController],
  providers: [
    // Use cases
    CreateLeagueUseCase,
    JoinLeagueUseCase,
    LeaveLeagueUseCase,
    ListPublicLeaguesUseCase,
    ListLeagueMembersUseCase,
    ListUserLeaguesUseCase,
    SetLeaguePrizesUseCase,
    GetLeaguePrizesUseCase,
    GetLeagueByIdUseCase,
    TransferLeagueOwnershipUseCase,
    SetLeaguePredictionSlotsUseCase,
    JoinPublicLeagueUseCase,

    // Puerto ↔ implementación (ahora sin comillas, la clase directo)
    { provide: LeagueRepository, useClass: LeaguePrismaRepository },
    { provide: LeagueMemberRepository, useClass: LeagueMemberPrismaRepository },
    { provide: LeaguePrizeRepository, useClass: LeaguePrizePrismaRepository },
    { provide: InviteCodeGenerator, useClass: NanoIdInviteCodeGenerator },
  ],
  exports: [LeagueRepository, LeagueMemberRepository],
})
export class LeaguesModule {}