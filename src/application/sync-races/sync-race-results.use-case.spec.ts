import { RaceRepository } from "../../domain/ports/race.repository";
import { DriverSessionResult, OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";
import { RaceResultRepository } from "../../domain/ports/race-result.repository";
import { RaceDriverResultRepository } from "../../domain/ports/race-driver-result.repository";
import { DriverRepository, DriverRepositoryResult } from "../../domain/ports/driver.repository";
import { RaceEntryRepository } from "../../domain/ports/race-entry.repository";
import { RaceEntry } from "../../domain/entities/race-entry.entity";
import { Race } from "../../domain/entities/race.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { SyncRaceEntriesUseCase } from "./sync-race-entries.use-case";

const mockOfficialResultsProvider: jest.Mocked<OfficialResultsProvider> = {
    getMeetings: jest.fn(),
    getSessionResults: jest.fn(),
    getDrivers: jest.fn(),
    getLatestStartedSessionKey: jest.fn(),
    hasRaceResults: jest.fn(),
    hasSafetyCar: jest.fn(),
};

const mockDriverRepository: jest.Mocked<DriverRepository> = {
    upsert: jest.fn(),
    findByDriverNumbers: jest.fn(),
    createIfMissing: jest.fn(),
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
    findLastResultsSynced: jest.fn(),
    findScheduledBeforeDate: jest.fn(),
    findLockedRacesWithPastStartTime: jest.fn(),
    findRacesPendingResultsSync: jest.fn(),
    updateStatus: jest.fn(),
};

const mockRaceEntryRepository: jest.Mocked<RaceEntryRepository> = {
    replaceForRace: jest.fn(),
    findByRaceId: jest.fn(),
    findGridByRaceId: jest.fn(),
    findLatestGrid: jest.fn(),
};

const mockSyncRaceEntries = {
    execute: jest.fn(),
    addMissingToRoster: jest.fn(),
} as unknown as jest.Mocked<SyncRaceEntriesUseCase>;

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
    { externalDriverNumber: 1, position: 1, dnf: false },
    { externalDriverNumber: 16, position: 2, dnf: false },
    { externalDriverNumber: 63, position: 3, dnf: true },
];

const fakeQualifyingResults: DriverSessionResult[] = [
    { externalDriverNumber: 16, position: 1, dnf: false },
    { externalDriverNumber: 1, position: 2, dnf: false },
];

// teamId = equipo ACTUAL del piloto (plantel)
const driver = (number: number, teamId: string): DriverRepositoryResult => ({
    id: `driver-${number}`, driverNumber: number, teamId,
});
const allDrivers = [driver(1, 'team-redbull'), driver(16, 'team-ferrari'), driver(63, 'team-mercedes')];

// Grilla de ESTA carrera: el #1 corrió con otro equipo que el actual
const entry = (driverId: string, teamId: string) => RaceEntry.create({ id: `entry-${driverId}`, raceId: 'race-1', driverId, teamId });
const raceGrid = [entry('driver-1', 'team-racing-bulls'), entry('driver-16', 'team-ferrari'), entry('driver-63', 'team-mercedes')];

function givenOfficialResults(race: DriverSessionResult[] = fakeRaceSessionResults, qualifying: DriverSessionResult[] = fakeQualifyingResults) {
    mockOfficialResultsProvider.getSessionResults
        .mockResolvedValueOnce(race)
        .mockResolvedValueOnce(qualifying);
    mockOfficialResultsProvider.hasSafetyCar.mockResolvedValue(true);
}

function expectNothingSaved() {
    expect(mockRaceResultRepository.upsert).not.toHaveBeenCalled();
    expect(mockRaceDriverResultRepository.replaceMany).not.toHaveBeenCalled();
    expect(mockRaceRepository.updateStatus).not.toHaveBeenCalled();
}

describe('SyncRaceResultsUseCase', () => {
    let useCase: SyncRaceResultsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new SyncRaceResultsUseCase(
            mockOfficialResultsProvider,
            mockDriverRepository,
            mockRaceResultRepository,
            mockRaceDriverResultRepository,
            mockRaceRepository,
            mockRaceEntryRepository,
            mockSyncRaceEntries,
        );
        mockRaceEntryRepository.findByRaceId.mockResolvedValue(raceGrid);
    });

    it('should sync race results using the team each driver raced with', async () => {
        givenOfficialResults();
        mockDriverRepository.findByDriverNumbers.mockResolvedValue(allDrivers);

        await useCase.execute(fakeRace);

        expect(mockRaceResultRepository.upsert).toHaveBeenCalledWith({
            raceId: fakeRace.id,
            poleDriverId: 'driver-16',
            raceWinnerDriverId: 'driver-1',
            raceWinnerTeamId: 'team-racing-bulls', // de la grilla, no el equipo actual
            safetyCar: true,
            dnfCount: 1,
        });
        expect(mockRaceDriverResultRepository.replaceMany).toHaveBeenCalledWith([
            { raceId: 'race-1', driverId: 'driver-1', teamId: 'team-racing-bulls', position: 1, dnf: false },
            { raceId: 'race-1', driverId: 'driver-16', teamId: 'team-ferrari', position: 2, dnf: false },
            { raceId: 'race-1', driverId: 'driver-63', teamId: 'team-mercedes', position: 3, dnf: true },
        ]);
        expect(mockRaceRepository.updateStatus).toHaveBeenCalledWith(fakeRace.id, RaceStatus.RESULTS_SYNCED);
    });

    it('should sync the grid from the race session before resolving drivers (last-minute replacements)', async () => {
        givenOfficialResults();
        mockDriverRepository.findByDriverNumbers.mockResolvedValue(allDrivers);

        await useCase.execute(fakeRace);

        expect(mockSyncRaceEntries.execute).toHaveBeenCalledWith(fakeRace, 100, { updateCurrentTeam: false });
        expect(mockSyncRaceEntries.execute.mock.invocationCallOrder[0])
            .toBeLessThan(mockDriverRepository.findByDriverNumbers.mock.invocationCallOrder[0]);
    });

    it('should add the pole sitter from qualifying when he did not start the race', async () => {
        givenOfficialResults(fakeRaceSessionResults, [{ externalDriverNumber: 44, position: 1, dnf: false }]);
        mockDriverRepository.findByDriverNumbers
            .mockResolvedValueOnce(allDrivers)
            .mockResolvedValueOnce([...allDrivers, driver(44, 'team-ferrari')]);

        await useCase.execute(fakeRace);

        expect(mockSyncRaceEntries.addMissingToRoster).toHaveBeenCalledWith('season-1', 101);
        expect(mockRaceResultRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ poleDriverId: 'driver-44' }));
    });

    it('should list every driver still missing and not save anything', async () => {
        givenOfficialResults(
            [...fakeRaceSessionResults, { externalDriverNumber: 9999, position: 4, dnf: false }],
            [{ externalDriverNumber: 8888, position: 1, dnf: false }],
        );
        mockDriverRepository.findByDriverNumbers.mockResolvedValue(allDrivers);

        await expect(useCase.execute(fakeRace)).rejects.toThrow(
            'Drivers 9999, 8888 not found for season season-1 while syncing Australian GP',
        );
        expectNothingSaved();
    });

    it('should throw if race has no race session key', async () => {
        const raceWithoutSessionKey = Race.create({ ...fakeRace, raceSessionKey: null });

        await expect(useCase.execute(raceWithoutSessionKey)).rejects.toThrow('Race Australian GP does not have a race session key');
        expect(mockOfficialResultsProvider.getSessionResults).not.toHaveBeenCalled();
    });

    it('should throw if race has no qualifying session key', async () => {
        const raceWithoutQualifyingSessionKey = Race.create({ ...fakeRace, qualifyingSessionKey: null });

        await expect(useCase.execute(raceWithoutQualifyingSessionKey)).rejects.toThrow('Race Australian GP does not have a qualifying session key');
        expect(mockOfficialResultsProvider.getSessionResults).not.toHaveBeenCalled();
    });

    it('should throw if pole position is missing', async () => {
        givenOfficialResults(fakeRaceSessionResults, [{ externalDriverNumber: 16, position: 2, dnf: false }]);

        await expect(useCase.execute(fakeRace)).rejects.toThrow('Could not find pole position for Australian GP');

        expect(mockSyncRaceEntries.execute).not.toHaveBeenCalled();
        expectNothingSaved();
    });

    it('should throw if winner is missing', async () => {
        givenOfficialResults([{ externalDriverNumber: 16, position: 2, dnf: false }]);

        await expect(useCase.execute(fakeRace)).rejects.toThrow('Could not find race winner for Australian GP');

        expect(mockSyncRaceEntries.execute).not.toHaveBeenCalled();
        expectNothingSaved();
    });
})
