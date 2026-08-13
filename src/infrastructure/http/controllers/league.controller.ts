import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CreateLeagueDto } from '../dtos/create-league.dto';
import { JoinLeagueDto } from '../dtos/join-league.dto';
import { SetLeaguePrizesDto } from '../dtos/set-league-prizes.dto';
import { CreateLeagueUseCase } from '../../../application/leagues/create-league/create-league.use-case';
import { JoinLeagueUseCase } from '../../../application/leagues/join-league/join-league.use-case';
import { LeaveLeagueUseCase } from '../../../application/leagues/leave-league/leave-league.use-case';
import { ListPublicLeaguesUseCase } from '../../../application/leagues/list-public-leagues/list-public-leagues.use-case';
import { ListLeagueMembersUseCase } from '../../../application/leagues/list-league-members/list-league-members.use-case';
import { SetLeaguePrizesUseCase } from '../../../application/leagues/set-league-prizes/set-league-prizes.use-case';
import { GetLeaguePrizesUseCase } from '../../../application/leagues/get-league-prizes/get-league-prizes.use-case';
import { TransferLeagueOwnershipDto } from '../dtos/transfer-league-ownership.dto';
import { TransferLeagueOwnershipUseCase } from '../../../application/leagues/transfer-league-ownership/transfer-league-ownership.use-case';
import { SetLeaguePredictionSlotsDto } from '../dtos/set-league-prediction-slots.dto';
import { SetLeaguePredictionSlotsUseCase } from '../../../application/leagues/set-league-prediction-slots/set-league-prediction-slots.use-case';
import { JoinPublicLeagueUseCase } from '../../../application/leagues/join-public-league/join-public-league.use-case';


@Controller('leagues')
@UseGuards(JwtAuthGuard)
export class LeagueController {
  constructor(
    private readonly createLeague: CreateLeagueUseCase,
    private readonly joinLeague: JoinLeagueUseCase,
    private readonly leaveLeague: LeaveLeagueUseCase,
    private readonly listPublicLeagues: ListPublicLeaguesUseCase,
    private readonly listLeagueMembers: ListLeagueMembersUseCase,
    private readonly setLeaguePrizes: SetLeaguePrizesUseCase,
    private readonly getLeaguePrizes: GetLeaguePrizesUseCase,
    private readonly transferOwnershipUseCase: TransferLeagueOwnershipUseCase,
    private readonly setPredictionSlotsUseCase: SetLeaguePredictionSlotsUseCase,
    private readonly joinPublicLeague: JoinPublicLeagueUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateLeagueDto, @CurrentUser() user: { userId: string }) {
    return this.createLeague.execute({ ...dto, ownerId: user.userId });
  }

  @Post('join')
  join(@Body() dto: JoinLeagueDto, @CurrentUser() user: { userId: string }) {
    return this.joinLeague.execute({ inviteCode: dto.inviteCode, userId: user.userId });
  }

  @Get('public')
  listPublic() {
    return this.listPublicLeagues.execute();
  }

  @Post(':leagueId/leave')
  leave(@Param('leagueId') leagueId: string, @CurrentUser() user: { userId: string }) {
    return this.leaveLeague.execute({ leagueId, userId: user.userId });
  }

  @Get(':leagueId/members')
  listMembers(@Param('leagueId') leagueId: string, @CurrentUser() user: { userId: string }) {
    return this.listLeagueMembers.execute({ leagueId, requesterId: user.userId });
  }

  @Post(':leagueId/prizes')
  setPrizes(
    @Param('leagueId') leagueId: string,
    @Body() dto: SetLeaguePrizesDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.setLeaguePrizes.execute({ leagueId, requesterId: user.userId, prizes: dto.prizes });
  }

  @Get(':leagueId/prizes')
  getPrizes(@Param('leagueId') leagueId: string, @CurrentUser() user: { userId: string }) {
    return this.getLeaguePrizes.execute({ leagueId, requesterId: user.userId });
  }

  @Post(':leagueId/transfer-ownership')
  transferOwnership(
    @Param('leagueId') leagueId: string,
    @Body() dto: TransferLeagueOwnershipDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.transferOwnershipUseCase.execute({
      leagueId,
      requesterId: user.userId,
      newOwnerId: dto.newOwnerId,
    });
  }

  @Post(':leagueId/prediction-slots')
  setPredictionSlots(
    @Param('leagueId') leagueId: string,
    @Body() dto: SetLeaguePredictionSlotsDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.setPredictionSlotsUseCase.execute({
      leagueId,
      requesterId: user.userId,
      predictionSlots: dto.predictionSlots,
    });
  }

  @Post(':leagueId/join-public')
  joinPublic(@Param('leagueId') leagueId: string, @CurrentUser() user: { userId: string }) {
    return this.joinPublicLeague.execute({ leagueId, userId: user.userId });
  }
}