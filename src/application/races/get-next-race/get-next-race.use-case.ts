import { Injectable } from "@nestjs/common"
import { Race } from "../../../domain/entities/race.entity"
import { RaceRepository } from "../../../domain/ports/race.repository"

@Injectable()
export class GetNextRaceUseCase {
    constructor (
        private readonly raceRepository: RaceRepository,
    ) {}

    async execute(): Promise<Race | null> {
        return this.raceRepository.findNext();
    }
}