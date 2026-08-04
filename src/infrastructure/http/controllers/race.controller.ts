import { Controller, Get, Param } from "@nestjs/common";
import { GetRacesUseCase } from "../../../application/races/get-races/get-races.use-case";
import { GetRaceByIdUseCase } from "../../../application/races/get-race/get-race-by-id.use-case";
import { GetNextRaceUseCase } from "../../../application/races/get-next-race/get-next-race.use-case";


@Controller('races')
export class RaceController {
    constructor(
        private readonly getRacesUseCase: GetRacesUseCase,
        private readonly getRaceByIdUseCase: GetRaceByIdUseCase,
        private readonly getNextRaceUseCase: GetNextRaceUseCase,
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

}