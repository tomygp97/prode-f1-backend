import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { GetUserPredictionUseCase } from './get-user-prediction.use-case';

const mockPredictionRepo: jest.Mocked<PredictionRepository> = {
    save: jest.fn(),
    findByLeagueRaceAndUser: jest.fn(),
    findAllByLeagueAndRace: jest.fn(),
};

describe('GetUserPredictionUseCase', () => {
    let useCase: GetUserPredictionUseCase;

    beforeEach(() => {
        useCase = new GetUserPredictionUseCase(mockPredictionRepo);
        jest.clearAllMocks();
    });

    it('should return the prediction if it exists', async () => {
        mockPredictionRepo.findByLeagueRaceAndUser.mockResolvedValue(
            Prediction.create({
                id: 'prediction-1', userId: 'user-1', leagueId: 'league-1', raceId: 'race-1',
                predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 1,
            })
        );

        const result = await useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1' });

        expect(result).not.toBeNull();
        expect(result?.id).toBe('prediction-1');
    });

    it('should return null if no prediction exists yet', async () => {
        mockPredictionRepo.findByLeagueRaceAndUser.mockResolvedValue(null);

        const result = await useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1' });

        expect(result).toBeNull();
    });
});