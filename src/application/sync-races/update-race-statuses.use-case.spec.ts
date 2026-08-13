import { RaceRepository } from "../../domain/ports/race.repository";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { UpdateRaceStatusUseCase } from "../sync-races/update-race-statuses.use-case";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { Race } from "../../domain/entities/race.entity";



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
}

const mockOfficialResultsProvider: jest.Mocked<OfficialResultsProvider> = {
    getMeetings: jest.fn(),
    getSessionResults: jest.fn(),
    getDrivers: jest.fn(),
    hasRaceResults: jest.fn(),
    hasSafetyCar: jest.fn(),
}

const fakeRaces = [
    Race.create(
    {
        id: 'race-1',
        seasonId: 'season-2026',
        name: 'Australian Grand Prix',
        circuit: 'Albert Park',
        country: 'Australia',
        round: 1,
        qualifyingStartAt: new Date('2026-01-01T05:00:00Z'),
        raceStartAt: new Date('2026-02-01T04:00:00Z'),
        status: RaceStatus.SCHEDULED,
        meetingKey: 1279,
        raceSessionKey: 11234,
        qualifyingSessionKey: 11230,
    }),

    Race.create(
    {
        id: 'race-2',
        seasonId: 'season-2026',
        name: 'Chinese Grand Prix',
        circuit: 'Shanghai',
        country: 'China',
        round: 2,
        qualifyingStartAt: new Date('2026-03-14T07:00:00Z'),
        raceStartAt: new Date('2026-03-15T07:00:00Z'),
        status: RaceStatus.LOCKED,
        meetingKey: 1280,
        raceSessionKey: 11245,
        qualifyingSessionKey: 11241,
    }),

    Race.create(
    {
        id: 'race-3',
        seasonId: 'season-2026',
        name: 'Japanese Grand Prix',
        circuit: 'Suzuka',
        country: 'Japan',
        round: 3,
        qualifyingStartAt: new Date('2026-03-28T06:00:00Z'),
        raceStartAt: new Date('2026-03-29T05:00:00Z'),
        status: RaceStatus.LOCKED,
        meetingKey: 1281,
        raceSessionKey: 11253,
        qualifyingSessionKey: 11249,
    }),

    Race.create(
    {
        id: 'race-4',
        seasonId: 'season-2026',
        name: 'Bahrain Grand Prix',
        circuit: 'Sakhir',
        country: 'Bahrain',
        round: 4,
        qualifyingStartAt: new Date('2026-04-11T16:00:00Z'),
        raceStartAt: new Date('2026-04-12T15:00:00Z'),
        status: RaceStatus.LOCKED,
        meetingKey: 1282,
        raceSessionKey: null,
        qualifyingSessionKey: 11257,
    }),
];

describe('UpdateRaceStatusUseCase', () => {
    let useCase: UpdateRaceStatusUseCase;

    beforeEach(() => {
        useCase = new UpdateRaceStatusUseCase(mockRaceRepository, mockOfficialResultsProvider);
        jest.clearAllMocks();
    });

    it('should update race status to locked', async () => {
        mockRaceRepository.findScheduledBeforeDate.mockResolvedValue([fakeRaces[0]]);
        mockRaceRepository.findLockedRacesWithPastStartTime.mockResolvedValue([]);

        await useCase.execute();

        expect(mockRaceRepository.updateStatus).toHaveBeenCalledTimes(1);
        expect(mockRaceRepository.updateStatus).toHaveBeenNthCalledWith(
            1,
            'race-1',
            RaceStatus.LOCKED
        );
    });

    it('should update race status to finished from locked', async () => {
        mockRaceRepository.findScheduledBeforeDate.mockResolvedValue([]);
        mockRaceRepository.findLockedRacesWithPastStartTime.mockResolvedValue([fakeRaces[1]]);
        mockOfficialResultsProvider.hasRaceResults.mockResolvedValue(true);

        await useCase.execute();

        expect(mockRaceRepository.updateStatus).toHaveBeenCalledTimes(1);
        expect(mockRaceRepository.updateStatus).toHaveBeenNthCalledWith(
            1,
            'race-2',
            RaceStatus.FINISHED,
        );
        expect(mockOfficialResultsProvider.hasRaceResults).toHaveBeenCalledTimes(1);
        expect(mockOfficialResultsProvider.hasRaceResults).toHaveBeenCalledWith(fakeRaces[1].raceSessionKey);
    });

    it('should keep race locked when no race results are available', async () => {
        mockRaceRepository.findScheduledBeforeDate.mockResolvedValue([]);
        mockRaceRepository.findLockedRacesWithPastStartTime.mockResolvedValue([fakeRaces[2]]);
        mockOfficialResultsProvider.hasRaceResults.mockResolvedValue(false);

        await useCase.execute();

        expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
        expect(mockOfficialResultsProvider.hasRaceResults).toHaveBeenCalledWith(fakeRaces[2].raceSessionKey);
    });

    it('should skip locked race without race session key', async () => {
        mockRaceRepository.findScheduledBeforeDate.mockResolvedValue([]);
        mockRaceRepository.findLockedRacesWithPastStartTime.mockResolvedValue([fakeRaces[3]]);
        mockOfficialResultsProvider.hasRaceResults.mockResolvedValue(false);

        await useCase.execute();

        expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
        expect(mockOfficialResultsProvider.hasRaceResults).not.toHaveBeenCalled();
    });
});