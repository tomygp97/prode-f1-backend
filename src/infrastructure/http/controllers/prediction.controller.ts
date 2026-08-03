import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { SubmitPredictionDto } from '../dtos/submit-prediction.dto';
import { SubmitPredictionUseCase } from '../../../application/predictions/submit-prediction/submit-prediction.use-case';
import { GetUserPredictionUseCase } from '../../../application/predictions/get-user-prediction/get-user-prediction.use-case';
import { ListPredictionsForRaceUseCase } from '../../../application/predictions/list-predictions-for-race/list-predictions-for-race.use-case';

@Controller('leagues/:leagueId/races/:raceId/predictions')
@UseGuards(JwtAuthGuard)
export class PredictionController {
  constructor(
    private readonly submitPrediction: SubmitPredictionUseCase,
    private readonly getUserPrediction: GetUserPredictionUseCase,
    private readonly listPredictionsForRace: ListPredictionsForRaceUseCase,
  ) {}

  @Post()
  submit(
    @Param('leagueId') leagueId: string,
    @Param('raceId') raceId: string,
    @Body() dto: SubmitPredictionDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.submitPrediction.execute({
      leagueId,
      raceId,
      userId: user.userId,
      predictedOrder: dto.predictedOrder,
      trackedDriverPosition: dto.trackedDriverPosition,
      safetyCar: dto.safetyCar,
      dnfCount: dto.dnfCount,
    });
  }

  @Get('me')
  getMine(
    @Param('leagueId') leagueId: string,
    @Param('raceId') raceId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.getUserPrediction.execute({ leagueId, raceId, userId: user.userId });
  }

  @Get()
  listAll(
    @Param('leagueId') leagueId: string,
    @Param('raceId') raceId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.listPredictionsForRace.execute({ leagueId, raceId, requesterId: user.userId });
  }
}