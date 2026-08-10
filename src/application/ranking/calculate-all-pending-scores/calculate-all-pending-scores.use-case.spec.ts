import { RaceRepository } from '../../../domain/ports/race.repository';
import { Race } from '../../../domain/entities/race.entity';
import { RaceStatus } from '../../../domain/enums/race-status.enum';
import { CalculateRaceScoresUseCase } from '../calculate-race-scores/calculate-race-scores.use-case';
import { CalculateAllPendingScoresUseCase } from './calculate-all-pending-scores.use-case';

const mockRaceRepo: jest.Mocked<RaceRepository> = {
    upsertFromMeeting: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByStatus: jest.fn(),
    findRacesPendingResultsSync: jest.fn(),
    findRacesPendingScoreCalculation: jest.fn(),
    markScoresCalculated: jest.fn(),
    findNext: jest.fn(),
    findScheduledBeforeDate: jest.fn(),
    findLockedRacesWithPastStartTime: jest.fn(),
    updateStatus: jest.fn(),
};

const mockCalculateRaceScores = {
    execute: jest.fn(),
} as unknown as jest.Mocked<CalculateRaceScoresUseCase>;

describe('CalculateAllPendingScoresUseCase', () => {
    let useCase: CalculateAllPendingScoresUseCase;

    const race = (id: string) => Race.create({
        id, seasonId: 'season-1', name: 'GP Test', circuit: 'Circuit', country: 'Country',
        round: 1, qualifyingStartAt: null, raceStartAt: null,
        status: RaceStatus.RESULTS_SYNCED, meetingKey: 1, raceSessionKey: null, qualifyingSessionKey: null,
    });

    beforeEach(() => {
        useCase = new CalculateAllPendingScoresUseCase(mockRaceRepo, mockCalculateRaceScores);
        jest.clearAllMocks();
    });

    it('should call CalculateRaceScoresUseCase for each race pending score calculation', async () => {
        mockRaceRepo.findRacesPendingScoreCalculation.mockResolvedValue([race('race-1'), race('race-2')]);
        mockCalculateRaceScores.execute.mockResolvedValue();

        await useCase.execute();

        expect(mockRaceRepo.findRacesPendingScoreCalculation).toHaveBeenCalledTimes(1);
        expect(mockCalculateRaceScores.execute).toHaveBeenCalledTimes(2);
        expect(mockCalculateRaceScores.execute).toHaveBeenCalledWith('race-1');
        expect(mockCalculateRaceScores.execute).toHaveBeenCalledWith('race-2');
    });

    it('should continue processing remaining races if one fails', async () => {
        mockRaceRepo.findRacesPendingScoreCalculation.mockResolvedValue([race('race-1'), race('race-2')]);
        mockCalculateRaceScores.execute
            .mockRejectedValueOnce(new Error('something went wrong'))
            .mockResolvedValueOnce();

        await useCase.execute();

        expect(mockCalculateRaceScores.execute).toHaveBeenCalledTimes(2);
    });

    it('should do nothing if there are no races pending', async () => {
        mockRaceRepo.findRacesPendingScoreCalculation.mockResolvedValue([]);

        await useCase.execute();

        expect(mockCalculateRaceScores.execute).not.toHaveBeenCalled();
    });
});