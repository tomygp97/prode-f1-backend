import { RaceDriverResult } from "../../../domain/entities/race-driver-result.entity";
import { RaceResult } from "../../../domain/entities/race-result.entity";
import { Race } from "../../../domain/entities/race.entity";
import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { RaceDriverResultRepository } from "../../../domain/ports/race-driver-result.repository";
import { RaceResultRepository } from "../../../domain/ports/race-result.repository";
import { RaceRepository } from "../../../domain/ports/race.repository";
import { GetRaceResultsUseCase } from "./get-race-results.use-case";

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
    updateStatus: jest.fn(),
};

const mockRaceResultRepository: jest.Mocked<RaceResultRepository> = {
    findByRaceId: jest.fn(),
    upsert: jest.fn(),
};

const mockRaceDriverResultRepository: jest.Mocked<RaceDriverResultRepository> = {
    findByRaceId: jest.fn(),
    replaceMany: jest.fn(),
};

const fakeRace = Race.create({
    id: 'race-1',
    seasonId: 'season-2026',
    name: 'Japanese Grand Prix',
    circuit: 'Suzuka',
    country: 'Japan',
    round: 3,
    qualifyingStartAt: new Date(),
    raceStartAt: new Date(),
    status: RaceStatus.RESULTS_SYNCED,
    meetingKey: 1281,
    raceSessionKey: 11253,
    qualifyingSessionKey: 11249,
});


const fakeRaceResult = RaceResult.create({
    id: 'result-1',
    raceId: 'race-1',
    poleDriverId: 'driver-1',
    raceWinnerDriverId: 'driver-1',
    raceWinnerTeamId: 'team-1',
    safetyCar: true,
    dnfCount: 2,
    syncedAt: new Date(),
});


const fakeDriverResult = RaceDriverResult.create({
    id: 'driver-result-1',
    raceId: 'race-1',
    driverId: 'driver-1',
    position: 1,
    dnf: false,
});

describe('GetRaceResultsUseCase', () => {

    let useCase: GetRaceResultsUseCase;


    beforeEach(() => {
        useCase = new GetRaceResultsUseCase(
            mockRaceRepository,
            mockRaceResultRepository,
            mockRaceDriverResultRepository,
        );

        jest.clearAllMocks();
    });

    it('should return race results', async () => {
        mockRaceRepository.findById.mockResolvedValue(fakeRace);

        mockRaceResultRepository.findByRaceId
            .mockResolvedValue(fakeRaceResult);

        mockRaceDriverResultRepository.findByRaceId
            .mockResolvedValue([
                fakeDriverResult
            ]);


        const result = await useCase.execute('race-1');


        expect(mockRaceRepository.findById)
            .toHaveBeenCalledWith('race-1');

        expect(mockRaceResultRepository.findByRaceId)
            .toHaveBeenCalledWith('race-1');

        expect(mockRaceDriverResultRepository.findByRaceId)
            .toHaveBeenCalledWith('race-1');


        expect(result).toEqual({
            race: fakeRace,
            result: fakeRaceResult,
            drivers: [
                fakeDriverResult
            ],
        });
    });

    it('should return race without results', async () => {
        mockRaceRepository.findById.mockResolvedValue(fakeRace);

        mockRaceResultRepository.findByRaceId
            .mockResolvedValue(null);

        mockRaceDriverResultRepository.findByRaceId
            .mockResolvedValue([]);


        const result = await useCase.execute('race-1');


        expect(result).toEqual({
            race: fakeRace,
            result: null,
            drivers: [],
        });
    });

    it('should throw error if race does not exist', async () => {
        mockRaceRepository.findById.mockResolvedValue(null);


        await expect(
            useCase.execute('invalid-id')
        ).rejects.toThrow('Race not found');


        expect(mockRaceResultRepository.findByRaceId)
            .not.toHaveBeenCalled();

        expect(mockRaceDriverResultRepository.findByRaceId)
            .not.toHaveBeenCalled();
    });

})