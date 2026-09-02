import { Prediction } from "../../../domain/entities/prediction.entity";
import { PredictionScore } from "../../../domain/entities/prediction-score.entity";
import { PredictionRepository } from "../../../domain/ports/prediction.repository";
import { PredictionScoreRepository } from "../../../domain/ports/prediction-score.repository";
import { GetUserPredictionScoreUseCase } from "./get-user-prediction-score.use-case";

const mockPredictionRepository: jest.Mocked<PredictionRepository> = {
    save: jest.fn(),
    findByLeagueRaceAndUser: jest.fn(),
    findAllByLeagueAndRace: jest.fn(),
    findAllByRaceId: jest.fn(),
};

const mockScoreRepository: jest.Mocked<PredictionScoreRepository> = {
    save: jest.fn(),
    findByPredictionId: jest.fn(),
};

const fakePrediction = Prediction.create({
    id: 'prediction-1',
    userId: 'user-1',
    leagueId: 'league-1',
    raceId: 'race-1',
    predictedOrder: ['driver-1', 'driver-2', 'driver-3'],
    predictedPoleDriverId: 'driver-1',
    trackedDriverPosition: null,
    safetyCar: true,
    dnfCount: 4,
});

const fakeScore = PredictionScore.create({
    id: 'score-1',
    predictionId: 'prediction-1',
    pointsBreakdown: {
        positions: 41,
        safetyCar: 5,
        dnfCount: 10,
        pole: 20,
        trackedDriver: 0,
    },
});

describe('GetUserPredictionScoreUseCase', () => {
    let useCase: GetUserPredictionScoreUseCase;

    beforeEach(() => {
        useCase = new GetUserPredictionScoreUseCase(
            mockPredictionRepository,
            mockScoreRepository,
        );

        jest.clearAllMocks();
    });

    it('should return prediction score', async () => {
        mockPredictionRepository.findByLeagueRaceAndUser.mockResolvedValue(
            fakePrediction,
        );

        mockScoreRepository.findByPredictionId.mockResolvedValue(fakeScore);

        const result = await useCase.execute({
            leagueId: 'league-1',
            raceId: 'race-1',
            userId: 'user-1',
        });

        expect(
            mockPredictionRepository.findByLeagueRaceAndUser,
        ).toHaveBeenCalledTimes(1);

        expect(
            mockPredictionRepository.findByLeagueRaceAndUser,
        ).toHaveBeenCalledWith(
            'league-1',
            'race-1',
            'user-1',
        );

        expect(
            mockScoreRepository.findByPredictionId,
        ).toHaveBeenCalledTimes(1);

        expect(
            mockScoreRepository.findByPredictionId,
        ).toHaveBeenCalledWith('prediction-1');

        expect(result).toEqual(fakeScore);
        expect(result?.totalPoints).toBe(76);
    });

    it('should return null if there is no prediction', async () => {
        mockPredictionRepository.findByLeagueRaceAndUser.mockResolvedValue(null);

        const result = await useCase.execute({
            leagueId: 'league-1',
            raceId: 'race-1',
            userId: 'user-1',
        });

        expect(
            mockPredictionRepository.findByLeagueRaceAndUser,
        ).toHaveBeenCalledTimes(1);

        expect(
            mockPredictionRepository.findByLeagueRaceAndUser,
        ).toHaveBeenCalledWith(
            'league-1',
            'race-1',
            'user-1',
        );

        expect(
            mockScoreRepository.findByPredictionId,
        ).not.toHaveBeenCalled();

        expect(result).toBeNull();
    });

    it('should return null if there is a prediction but no score', async () => {
        mockPredictionRepository.findByLeagueRaceAndUser.mockResolvedValue(
            fakePrediction,
        );

        mockScoreRepository.findByPredictionId.mockResolvedValue(null);

        const result = await useCase.execute({
            leagueId: 'league-1',
            raceId: 'race-1',
            userId: 'user-1',
        });

        expect(
            mockPredictionRepository.findByLeagueRaceAndUser,
        ).toHaveBeenCalledTimes(1);

        expect(
            mockScoreRepository.findByPredictionId,
        ).toHaveBeenCalledTimes(1);

        expect(
            mockScoreRepository.findByPredictionId,
        ).toHaveBeenCalledWith('prediction-1');

        expect(result).toBeNull();
    });
});