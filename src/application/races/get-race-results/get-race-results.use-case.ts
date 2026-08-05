import { Injectable } from "@nestjs/common";
import { Race } from "../../../domain/entities/race.entity";
import { RaceDriverResult } from "../../../domain/entities/race-driver-result.entity";
import { RaceResult } from "../../../domain/entities/race-result.entity";
import { RaceRepository } from "../../../domain/ports/race.repository";
import { RaceResultRepository } from "../../../domain/ports/race-result.repository";
import { RaceDriverResultRepository } from "../../../domain/ports/race-driver-result.repository";

export interface GetRaceResultsResponse {
    race: Race,
    result: RaceResult | null,
    drivers: RaceDriverResult[],
}

@Injectable()
export class GetRaceResultsUseCase {
    constructor (
        private readonly raceRepository: RaceRepository,
        private readonly raceResultRepository: RaceResultRepository,
        private readonly raceDriverResultRepository: RaceDriverResultRepository,
    ) {}

    async execute(id: string): Promise<GetRaceResultsResponse> {
        const race = await this.raceRepository.findById(id);
        if (!race) {
            throw new Error('Race not found');
        };

        const raceResult = await this.raceResultRepository.findByRaceId(id);
        const driversResult = await this.raceDriverResultRepository.findByRaceId(id);

        return {
            race,
            result: raceResult,
            drivers: driversResult,
        }
    }
}