import { RaceStatus } from "../../domain/enums/race-status.enum";
import { RaceRepository } from "../../domain/ports/race.repository";
import { SyncAllRaceResultsUseCase } from "./sync-all-race-results.use-case";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";
import { Race } from "../../domain/entities/race.entity";

const mockRaceRepository: jest.Mocked<RaceRepository> = {
    upsertFromMeeting: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findNext: jest.fn(),
    findScheduledBeforeDate: jest.fn(),
    findLockedRacesWithPastStartTime: jest.fn(),
    findRacesPendingResultsSync: jest.fn(),
    updateStatus: jest.fn(),
};

const mockSyncRaceResultsUseCase = {
    execute: jest.fn(),
};

const fakeRace1 = Race.create({
    id: 'race-1',
    seasonId: 'season-1',
    name: 'Australian GP',
    circuit: 'Albert Park',
    country: 'Australia',
    round: 1,
    qualifyingStartAt: new Date('2026-03-07T05:00:00Z'),
    raceStartAt: new Date('2026-03-08T04:00:00Z'),
    status: RaceStatus.FINISHED,
    meetingKey: 1,
    raceSessionKey: 100,
    qualifyingSessionKey: 101,
});

const fakeRace2 = Race.create({
    id: 'race-2',
    seasonId: 'season-1',
    name: 'Chinese GP',
    circuit: 'Shanghai International Circuit',
    country: 'China',
    round: 2,
    qualifyingStartAt: new Date('2026-03-21T07:00:00Z'),
    raceStartAt: new Date('2026-03-22T07:00:00Z'),
    status: RaceStatus.FINISHED,
    meetingKey: 2,
    raceSessionKey: 200,
    qualifyingSessionKey: 201,
});

describe('SyncAllRaceResultsUseCase', () => {
    let useCase: SyncAllRaceResultsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new SyncAllRaceResultsUseCase(
            mockRaceRepository,
            mockSyncRaceResultsUseCase as unknown as SyncRaceResultsUseCase,
        );
    });

    it('should sync all pending race results', async () => {
        mockRaceRepository.findRacesPendingResultsSync.mockResolvedValue([
            fakeRace1,
            fakeRace2,
        ]);

        mockSyncRaceResultsUseCase.execute.mockResolvedValue(undefined);

        await useCase.execute();

        expect(mockRaceRepository.findRacesPendingResultsSync).toHaveBeenCalledTimes(1);
        expect(mockSyncRaceResultsUseCase.execute).toHaveBeenCalledTimes(2);
        expect(mockSyncRaceResultsUseCase.execute).toHaveBeenNthCalledWith(1, fakeRace1);
        expect(mockSyncRaceResultsUseCase.execute).toHaveBeenNthCalledWith(2, fakeRace2);
    });

    it('should not sync when there are no pending races', async () => {
        mockRaceRepository.findRacesPendingResultsSync.mockResolvedValue([]);

        await useCase.execute();

        expect(mockRaceRepository.findRacesPendingResultsSync).toHaveBeenCalledTimes(1);
        expect(mockSyncRaceResultsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should continue syncing remaining races if one fails', async () => {
        mockRaceRepository.findRacesPendingResultsSync.mockResolvedValue([
            fakeRace1,
            fakeRace2,
        ]);

        mockSyncRaceResultsUseCase.execute
            .mockRejectedValueOnce(new Error('Boom'))
            .mockResolvedValueOnce(undefined);

        await useCase.execute();

        expect(mockSyncRaceResultsUseCase.execute).toHaveBeenCalledTimes(2);
        expect(mockSyncRaceResultsUseCase.execute).toHaveBeenNthCalledWith(1, fakeRace1);
        expect(mockSyncRaceResultsUseCase.execute).toHaveBeenNthCalledWith(2, fakeRace2);
    });
})