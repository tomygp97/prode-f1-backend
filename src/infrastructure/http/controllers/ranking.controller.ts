import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GetLeagueStandingsUseCase } from '../../../application/ranking/get-league-standings/get-league-standings.use-case';

@Controller('leagues/:leagueId/standings')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(
    private readonly getLeagueStandings: GetLeagueStandingsUseCase,
  ) {}

  @Get()
  getStandings(@Param('leagueId') leagueId: string, @CurrentUser() user: { userId: string }) {
    return this.getLeagueStandings.execute({ leagueId, requesterId: user.userId });
  }
}
