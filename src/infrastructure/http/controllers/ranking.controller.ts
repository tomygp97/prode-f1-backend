import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GetLeagueStandingsUseCase } from '../../../application/ranking/get-league-standings/get-league-standings.use-case';

@Controller('leagues/:leagueId/standings')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(
    private readonly getLeagueStandings: GetLeagueStandingsUseCase,
  ) {}

  @Get()
  getStandings(@Param('leagueId') leagueId: string) {
    return this.getLeagueStandings.execute({ leagueId });
  }
}