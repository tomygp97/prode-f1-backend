import { Injectable } from "@nestjs/common";
import { PredictionScoreRepository } from "../../../domain/ports/prediction-score.repository";
import { PredictionRepository } from "../../../domain/ports/prediction.repository";
import { PredictionScore } from "src/domain/entities/prediction-score.entity";


@Injectable()
export class GetUserPredictionScoreUseCase {
    constructor(
        private readonly predictionRepository: PredictionRepository,
        private readonly scoreRepository: PredictionScoreRepository,
    ) {}

    async execute(input: {
        leagueId: string
        raceId: string
        userId: string
    }): Promise<PredictionScore | null> {
        const prediction = await this.predictionRepository.findByLeagueRaceAndUser(
            input.leagueId,
            input.raceId,
            input.userId
        )

        if (!prediction) return null

        return this.scoreRepository.findByPredictionId(prediction.id)
    }
}