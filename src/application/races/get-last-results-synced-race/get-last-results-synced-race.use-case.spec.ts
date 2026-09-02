import { RaceRepository } from "../../../domain/ports/race.repository";
import { Race } from "../../../domain/entities/race.entity";
import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { GetLastResultsSyncedRaceUseCase } from "./get-last-results-synced-race.use-case";

const mockRaceRepository: jest.Mocked<RaceRepository> = {
    upsertFromMeeting: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByStatus: jest.fn(),
    findRacesPendingScoreCalculation: jest.fn(),
    markScoresCalculated: jest.fn(),
    findNext: jest.fn(),
    findScheduledBeforeDate: jest.fn(),
    findLockedRacesWithPastStartTime: jest.fn(),
    findRacesPendingResultsSync: jest.fn(),
    findLastResultsSynced: jest.fn(),
    updateStatus: jest.fn(),
};

const fakeRace = Race.create({
    id: 'race-13',
    seasonId: 'season-1',
    name: 'Hungarian GP',
    circuit: 'Hungaroring',
    country: 'Hungary',
    round: 13,
    qualifyingStartAt: new Date('2026-07-25T14:00:00Z'),
    raceStartAt: new Date('2026-07-26T13:00:00Z'),
    status: RaceStatus.RESULTS_SYNCED,
    meetingKey: 1291,
    raceSessionKey: 11342,
    qualifyingSessionKey: 11338,
});

describe('GetLastResultsSyncedRaceUseCase', () => {
    let useCase: GetLastResultsSyncedRaceUseCase;

    beforeEach(() => {
        useCase = new GetLastResultsSyncedRaceUseCase(mockRaceRepository);
        jest.clearAllMocks();
    });

    it('should return last results synced race', async () => {
        mockRaceRepository.findLastResultsSynced.mockResolvedValue(fakeRace);

        const result = await useCase.execute();

        expect(mockRaceRepository.findLastResultsSynced).toHaveBeenCalledTimes(1);
        expect(result).toEqual(fakeRace);
    });

    it('should return null if there is no results synced race', async () => {
        mockRaceRepository.findLastResultsSynced.mockResolvedValue(null);

        const result = await useCase.execute();

        expect(mockRaceRepository.findLastResultsSynced).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });
});