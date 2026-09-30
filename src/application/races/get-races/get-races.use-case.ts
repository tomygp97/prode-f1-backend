import { Injectable } from "@nestjs/common";
import { Race } from "../../../domain/entities/race.entity";
import { RaceRepository } from "../../../domain/ports/race.repository";

@Injectable()
export class GetRacesUseCase {
    constructor(
        private readonly raceRepository: RaceRepository,
    ) {}

    async execute(): Promise<Race[]> {
        return this.raceRepository.findAll();
    }
}