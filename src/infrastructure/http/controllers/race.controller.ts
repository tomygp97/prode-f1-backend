import { Controller, Get, Param } from "@nestjs/common";
import { GetRacesUseCase } from "../../../application/races/get-races/get-races.use-case";
import { GetRaceByIdUseCase } from "../../../application/races/get-race/get-race-by-id.use-case";
import { GetNextRaceUseCase } from "../../../application/races/get-next-race/get-next-race.use-case";
import { GetRaceResultsUseCase } from "../../../application/races/get-race-results/get-race-results.use-case";
import { RaceDto } from "../dtos/race.dto";
import { RaceResultDto } from "../dtos/race-result.dto";
import { RaceDriverResultDto } from "../dtos/race-driver-result.dto";


@Controller('races')
export class RaceController {
    constructor(
        private readonly getRacesUseCase: GetRacesUseCase,
        private readonly getRaceByIdUseCase: GetRaceByIdUseCase,
        private readonly getNextRaceUseCase: GetNextRaceUseCase,
        private readonly getRaceResultsUseCase: GetRaceResultsUseCase,
    ) {}

    @Get()
    async getRaces() {
        return this.getRacesUseCase.execute();
    }

    @Get('next')
    async getNextRace() {
        return this.getNextRaceUseCase.execute();
    }
    
    @Get(':id')
    async getRaceById(
        @Param('id') id: string
    ) {
        return this.getRaceByIdUseCase.execute(id);
    }
    
    @Get(':id/results')
    async getRaceResults(
        @Param('id') id: string
    ) {
        const response = await this.getRaceResultsUseCase.execute(id);
        return {
            race: RaceDto.fromDomain(response.race),
            result: response.result
                ? RaceResultDto.fromDomain(response.result)
                : null,
            drivers: response.drivers.map(
                RaceDriverResultDto.fromDomain
            )
        }
    }

}