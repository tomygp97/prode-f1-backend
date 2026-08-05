import { Injectable } from "@nestjs/common";
import { RaceRepository } from "../../../domain/ports/race.repository";
import { Race } from "../../../domain/entities/race.entity";


@Injectable()
export class GetRaceByIdUseCase {
    constructor(
        private readonly raceRepository: RaceRepository
    ) {}

    async execute(id: string): Promise<Race | null> {
        return this.raceRepository.findById(id)
    }
}