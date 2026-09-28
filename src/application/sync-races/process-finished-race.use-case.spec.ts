import { RaceRepository } from "../../domain/ports/race.repository";
import { Race } from "../../domain/entities/race.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { CalculateRaceScoresUseCase } from "../ranking/calculate-race-scores/calculate-race-scores.use-case";
import { ProcessFinishedRaceUseCase } from "./process-finished-race.use-case";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";

const mockRaceRepository = { findById: jest.fn() } as unknown as jest.Mocked<RaceRepository>;
const mockSyncRaceResults = { execute: jest.fn() } as unknown as jest.Mocked<SyncRaceResultsUseCase>;
const mockCalculateRaceScores = { execute: jest.fn() } as unknown as jest.Mocked<CalculateRaceScoresUseCase>;

const race = (status: RaceStatus) => Race.create({
    id: 'race-1', seasonId: 'season-1', name: 'Azerbaijan GP', circuit: 'Baku', country: 'Azerbaijan', round: 17,
    qualifyingStartAt: null, raceStartAt: null, status, meetingKey: 1295, raceSessionKey: 11377, qualifyingSessionKey: 11373,
});

describe('ProcessFinishedRaceUseCase', () => {
    let useCase: ProcessFinishedRaceUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ProcessFinishedRaceUseCase(mockRaceRepository, mockSyncRaceResults, mockCalculateRaceScores);
    });

    it('should sync results and then calculate scores for a finished race', async () => {
        mockRaceRepository.findById.mockResolvedValue(race(RaceStatus.FINISHED));

        await useCase.execute('race-1');

        expect(mockSyncRaceResults.execute).toHaveBeenCalledWith(expect.objectContaining({ id: 'race-1' }));
        expect(mockCalculateRaceScores.execute).toHaveBeenCalledWith('race-1');
        expect(mockSyncRaceResults.execute.mock.invocationCallOrder[0])
            .toBeLessThan(mockCalculateRaceScores.execute.mock.invocationCallOrder[0]);
    });

    it('should not calculate scores if syncing the results fails (hourly jobs retry)', async () => {
        mockRaceRepository.findById.mockResolvedValue(race(RaceStatus.FINISHED));
        mockSyncRaceResults.execute.mockRejectedValue(new Error('OpenF1 down'));

        await expect(useCase.execute('race-1')).rejects.toThrow('OpenF1 down');
        expect(mockCalculateRaceScores.execute).not.toHaveBeenCalled();
    });

    it('should do nothing if the race is no longer FINISHED (already processed)', async () => {
        mockRaceRepository.findById.mockResolvedValue(race(RaceStatus.RESULTS_SYNCED));

        await useCase.execute('race-1');

        expect(mockSyncRaceResults.execute).not.toHaveBeenCalled();
    });
});
