import { Controller, Get } from '@nestjs/common';
import { GetCurrentSeasonUseCase } from '../../../application/seasons/get-current-season/get-current-season.use-case';

@Controller('seasons')
export class SeasonController {
  constructor(
    private readonly getCurrentSeason: GetCurrentSeasonUseCase,
  ) {}

  @Get('current')
  getCurrent() {
    return this.getCurrentSeason.execute();
  }
}