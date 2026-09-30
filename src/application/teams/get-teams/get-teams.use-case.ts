import { Injectable } from "@nestjs/common";
import { Team } from "../../../domain/entities/team.entity";
import { TeamRepository } from "../../../domain/ports/team.repository";

@Injectable()
export class GetTeamsUseCase {
    constructor(private readonly teamRepository: TeamRepository) {}

    async execute(): Promise<Team[]> {
        return this.teamRepository.findAll();
    }
}