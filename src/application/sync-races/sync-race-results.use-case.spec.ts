import { RaceRepository } from "../../domain/ports/race.repository";
import { DriverSessionResult, OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";
import { RaceResultRepository } from "../../domain/ports/race-result.repository";
import { RaceDriverResultRepository } from "../../domain/ports/race-driver-result.repository";
import { DriverRepository } from "../../domain/ports/driver.repository";
import { Race } from "../../domain/entities/race.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";

const mockOfficialResultsProvider: jest.Mocked<OfficialResultsProvider> = {
    getMeetings: jest.fn(),
    getSessionResults: jest.fn(),
    getDrivers: jest.fn(),
    hasRaceResults: jest.fn(),
    hasSafetyCar: jest.fn(),
};

const mockDriverRepository: jest.Mocked<DriverRepository> = {
    upsert: jest.fn(),
    findByDriverNumbers: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
};

const mockRaceResultRepository: jest.Mocked<RaceResultRepository> = {
    upsert: jest.fn(),
    findByRaceId: jest.fn(),
};
const mockRaceDriverResultRepository: jest.Mocked<RaceDriverResultRepository> = {
    replaceMany: jest.fn(),
    findByRaceId: jest.fn(),
};

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

const fakeRace = Race.create({
    id: 'race-1',
    seasonId: 'season-1',
    name: 'Australian GP',
    circuit: 'Albert Park',
    country: 'Australia',
    round: 1,
    qualifyingStartAt: new Date(),
    raceStartAt: new Date(),
    status: RaceStatus.FINISHED,
    meetingKey: 1,
    raceSessionKey: 100,
    qualifyingSessionKey: 101,
});

const fakeRaceSessionResults: DriverSessionResult[] = [
    {
        externalDriverNumber: 1,
        position: 1,
        dnf: false,
    },
    {
        externalDriverNumber: 16,
        position: 2,
        dnf: false,
    },
    {
        externalDriverNumber: 63,
        position: 3,
        dnf: true,
    },
];

const fakeQualifyingResults: DriverSessionResult[] = [
    {
        externalDriverNumber: 16,
        position: 1,
        dnf: false,
    },
    {
        externalDriverNumber: 1,
        position: 2,
        dnf: false,
    },
];

describe('SyncRaceResultsUseCase', () => {
    let useCase: SyncRaceResultsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new SyncRaceResultsUseCase(mockOfficialResultsProvider, mockDriverRepository, mockRaceResultRepository, mockRaceDriverResultRepository, mockRaceRepository);
    });

    it('should sync race results successfully', async () => {
        mockOfficialResultsProvider.getSessionResults
            .mockResolvedValueOnce(fakeRaceSessionResults)
            .mockResolvedValueOnce(fakeQualifyingResults);
        mockOfficialResultsProvider.hasSafetyCar.mockResolvedValue(true);

        mockDriverRepository.findByDriverNumbers.mockResolvedValue([
            {
                id: 'driver-1',
                driverNumber: 1,
                teamId: 'team-redbull',
            },
            {
                id: 'driver-16',
                driverNumber: 16,
                teamId: 'team-ferrari',
            },
            {
                id: 'driver-63',
                driverNumber: 63,
                teamId: 'team-mercedes',
            },
        ]);
        mockRaceResultRepository.upsert.mockResolvedValue();
        mockRaceDriverResultRepository.replaceMany.mockResolvedValue();
        mockRaceRepository.updateStatus.mockResolvedValue();

        await useCase.execute(fakeRace);

        expect(mockRaceResultRepository.upsert).toHaveBeenCalledWith({
            raceId: fakeRace.id,
            poleDriverId: 'driver-16',
            raceWinnerDriverId: 'driver-1',
            raceWinnerTeamId: 'team-redbull',
            safetyCar: true,
            dnfCount: 1,
        });

        expect(mockRaceDriverResultRepository.replaceMany).toHaveBeenCalled();
        expect(mockRaceRepository.updateStatus).toHaveBeenCalledWith(
            fakeRace.id,
            RaceStatus.RESULTS_SYNCED
        );
    });

    it('should throw if race has no race session key', async () => {
        const fakeRaceWithoutSessionKey = Race.create({
            id: 'race-1',
            seasonId: 'season-1',
            name: 'Australian GP',
            circuit: 'Albert Park',
            country: 'Australia',
            round: 1,
            qualifyingStartAt: new Date(),
            raceStartAt: new Date(),
            status: RaceStatus.FINISHED,
            meetingKey: 1,
            raceSessionKey: null,
            qualifyingSessionKey: 101,
        });

        await expect(useCase.execute(fakeRaceWithoutSessionKey)).rejects.toThrow('Race Australian GP does not have a race session key');
        expect(mockOfficialResultsProvider.getSessionResults).not.toHaveBeenCalled();
    });

    it('should throw if race has no qualifying session key', async () => {
        const fakeRaceWithoutQualifyingSessionKey = Race.create({
            id: 'race-1',
            seasonId: 'season-1',
            name: 'Australian GP',
            circuit: 'Albert Park',
            country: 'Australia',
            round: 1,
            qualifyingStartAt: new Date(),
            raceStartAt: new Date(),
            status: RaceStatus.FINISHED,
            meetingKey: 1,
            raceSessionKey: 101,
            qualifyingSessionKey: null,
        });

        await expect(useCase.execute(fakeRaceWithoutQualifyingSessionKey)).rejects.toThrow('Race Australian GP does not have a qualifying session key');
        expect(mockOfficialResultsProvider.getSessionResults).not.toHaveBeenCalled();
    });

    it('should throw if pole position is missing', async () => {
        const fakeQualifyingResultsWithoutPole: DriverSessionResult[] = [
            {
                externalDriverNumber: 16,
                position: 2,
                dnf: false,
            },
            {
                externalDriverNumber: 1,
                position: 3,
                dnf: false,
            },
        ];
        mockOfficialResultsProvider.getSessionResults
            .mockResolvedValueOnce(fakeRaceSessionResults)
            .mockResolvedValueOnce(fakeQualifyingResultsWithoutPole);
        mockOfficialResultsProvider.hasSafetyCar.mockResolvedValue(false);

        await expect(useCase.execute(fakeRace)).rejects.toThrow('Could not find pole position for Australian GP');

        expect(mockDriverRepository.findByDriverNumbers).not.toHaveBeenCalled();
        expect(mockRaceResultRepository.upsert).not.toHaveBeenCalled();
        expect(mockRaceDriverResultRepository.replaceMany).not.toHaveBeenCalled();
        expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw if winner is missing', async () => {
        const fakeSessionResultsWithoutWinner: DriverSessionResult[] = [
            {
                externalDriverNumber: 16,
                position: 2,
                dnf: false,
            },
            {
                externalDriverNumber: 1,
                position: 3,
                dnf: false,
            },
        ];
        mockOfficialResultsProvider.getSessionResults
            .mockResolvedValueOnce(fakeSessionResultsWithoutWinner)
            .mockResolvedValueOnce(fakeQualifyingResults);
        mockOfficialResultsProvider.hasSafetyCar.mockResolvedValue(false);

        await expect(useCase.execute(fakeRace)).rejects.toThrow('Could not find race winner for Australian GP');

        expect(mockDriverRepository.findByDriverNumbers).not.toHaveBeenCalled();
        expect(mockRaceResultRepository.upsert).not.toHaveBeenCalled();
        expect(mockRaceDriverResultRepository.replaceMany).not.toHaveBeenCalled();
        expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw if pole driver is not found', async () => {
        const fakeQualifyingResultsWithUnknownPoleDriver: DriverSessionResult[] = [
            {
                externalDriverNumber: 9999,
                position: 1,
                dnf: false,
            },
            {
                externalDriverNumber: 16,
                position: 2,
                dnf: false,
            },
        ];
        mockOfficialResultsProvider.getSessionResults
            .mockResolvedValueOnce(fakeRaceSessionResults)
            .mockResolvedValueOnce(fakeQualifyingResultsWithUnknownPoleDriver);
        mockOfficialResultsProvider.hasSafetyCar.mockResolvedValue(false);
        mockDriverRepository.findByDriverNumbers.mockResolvedValue([]);

        await expect(useCase.execute(fakeRace)).rejects.toThrow('Pole driver 9999 not found for season season-1 while syncing Australian GP');

        expect(mockRaceResultRepository.upsert).not.toHaveBeenCalled();
        expect(mockRaceDriverResultRepository.replaceMany).not.toHaveBeenCalled();
        expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw if winner driver is not found', async () => {
        const fakeRaceSessionResultsWithUnknownWinnerDriver: DriverSessionResult[] = [
            {
                externalDriverNumber: 9999,
                position: 1,
                dnf: false,
            },
            {
                externalDriverNumber: 16,
                position: 2,
                dnf: false,
            },
        ];

        mockOfficialResultsProvider.getSessionResults
            .mockResolvedValueOnce(fakeRaceSessionResultsWithUnknownWinnerDriver)
            .mockResolvedValueOnce(fakeQualifyingResults);
        mockOfficialResultsProvider.hasSafetyCar.mockResolvedValue(false);
        mockDriverRepository.findByDriverNumbers.mockResolvedValue([
            {
                id: 'driver-16',
                driverNumber: 16,
                teamId: 'team-ferrari',
            },
        ]);

        await expect(useCase.execute(fakeRace)).rejects.toThrow('Race winner driver 9999 not found for season season-1 while syncing Australian GP');

        expect(mockRaceResultRepository.upsert).not.toHaveBeenCalled();
        expect(mockRaceDriverResultRepository.replaceMany).not.toHaveBeenCalled();
        expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
    });
    
    it('should throw if any race driver is not found', async () => {
        const fakeRaceSessionResultsWithUnknownDriver: DriverSessionResult[] = [
            {
                externalDriverNumber: 1, // ganador
                position: 1,
                dnf: false,
            },
            {
                externalDriverNumber: 16, // piloto normal
                position: 2,
                dnf: false,
            },
            {
                externalDriverNumber: 9999, // este no existe en DB
                position: 3,
                dnf: false,
            },
        ];

        const fakeQualifyingResults = [
            {
                externalDriverNumber: 16,
                position: 1,
                dnf: false,
            },
        ];

        mockOfficialResultsProvider.getSessionResults
            .mockResolvedValueOnce(fakeRaceSessionResultsWithUnknownDriver)
            .mockResolvedValueOnce(fakeQualifyingResults);
        mockOfficialResultsProvider.hasSafetyCar.mockResolvedValue(false);

        mockDriverRepository.findByDriverNumbers.mockResolvedValue([
            {
                id: 'driver-1',
                driverNumber: 1,
                teamId: 'team-1',
            },
            {
                id: 'driver-16',
                driverNumber: 16,
                teamId: 'team-2',
            },
        ]);
    

        await expect(useCase.execute(fakeRace)).rejects.toThrow('Driver 9999 not found for season season-1 while syncing Australian GP');

        expect(mockRaceResultRepository.upsert).not.toHaveBeenCalled();
        expect(mockRaceDriverResultRepository.replaceMany).not.toHaveBeenCalled();
        expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
    });
})