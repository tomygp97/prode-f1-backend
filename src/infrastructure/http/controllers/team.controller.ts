import { Controller, Get } from "@nestjs/common";
import { GetTeamsUseCase } from "../../../application/teams/get-teams/get-teams.use-case";


@Controller('teams')
export class TeamController {
    constructor(
        private readonly getTeamsUseCase: GetTeamsUseCase
    ) {}
    
    @Get()
    async getTeams() {
        return this.getTeamsUseCase.execute();
    }
}