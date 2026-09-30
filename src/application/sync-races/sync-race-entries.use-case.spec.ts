import { DriverRepository } from "../../domain/ports/driver.repository";
import { DriverData, OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { RaceEntryRepository } from "../../domain/ports/race-entry.repository";
import { TeamRepository } from "../../domain/ports/team.repository";
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
const mockTeamRepository: jest.Mocked<TeamRepository> = {
    upsert: jest.fn(),
    findByName: jest.fn(),
    findAll: jest.fn(),
};
const mockDriverRepository: jest.Mocked<DriverRepository> = {
    upsert: jest.fn(),
    createIfMissing: jest.fn(),
    findByDriverNumbers: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
};
const mockRaceEntryRepository: jest.Mocked<RaceEntryRepository> = {
    replaceForRace: jest.fn(),
    findByRaceId: jest.fn(),
    findGridByRaceId: jest.fn(),
    findLatestGrid: jest.fn(),
};

const fakeRace = Race.create({
    id: 'race-1', seasonId: 'season-1', name: 'Spanish GP', circuit: 'Madring', country: 'Spain',
    round: 16, qualifyingStartAt: new Date(), raceStartAt: new Date(), status: RaceStatus.FINISHED,
    meetingKey: 1294, raceSessionKey: 11369, qualifyingSessionKey: 11365,
});

const openF1Driver = (driverNumber: number, acronym: string, teamName: string): DriverData => ({
    driverNumber, fullName: acronym, acronym, teamName, teamColour: 'FFFFFF',
});

describe('SyncRaceEntriesUseCase', () => {
    let useCase: SyncRaceEntriesUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new SyncRaceEntriesUseCase(mockOfficialResultsProvider, mockTeamRepository, mockDriverRepository, mockRaceEntryRepository);
        mockTeamRepository.upsert.mockImplementation(async ({ name }) => `team-${name}`);
        mockDriverRepository.upsert.mockImplementation(async ({ driverNumber }) => `driver-${driverNumber}`);
        mockDriverRepository.createIfMissing.mockImplementation(async ({ driverNumber }) => `driver-${driverNumber}`);
    });

    it('should replace the race grid, including a last-minute replacement, with the team of that race', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([
            openF1Driver(1, 'NOR', 'McLaren'),
            openF1Driver(22, 'TSU', 'Racing Bulls'), // reemplazo que no estaba en el plantel
        ]);

        const synced = await useCase.execute(fakeRace, 11369, { updateCurrentTeam: false });

        expect(synced).toBe(2);
        expect(mockOfficialResultsProvider.getDrivers).toHaveBeenCalledWith(11369);
        expect(mockRaceEntryRepository.replaceForRace).toHaveBeenCalledWith('race-1', [
            { driverId: 'driver-1', teamId: 'team-McLaren' },
            { driverId: 'driver-22', teamId: 'team-Racing Bulls' },
        ]);
    });

    it('should not overwrite the current team of existing drivers when syncing a past race', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([openF1Driver(1, 'NOR', 'McLaren')]);

        await useCase.execute(fakeRace, 11369, { updateCurrentTeam: false });

        expect(mockDriverRepository.createIfMissing).toHaveBeenCalledWith(expect.objectContaining({ driverNumber: 1, seasonId: 'season-1' }));
        expect(mockDriverRepository.upsert).not.toHaveBeenCalled();
    });

    it('should update the current team when syncing the upcoming race', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([openF1Driver(1, 'NOR', 'McLaren')]);

        await useCase.execute(fakeRace, 11373, { updateCurrentTeam: true });

        expect(mockDriverRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ driverNumber: 1, teamId: 'team-McLaren' }));
        expect(mockDriverRepository.createIfMissing).not.toHaveBeenCalled();
    });

    it('should leave the grid untouched when the session has no drivers yet', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([]);

        const synced = await useCase.execute(fakeRace, 11731, { updateCurrentTeam: true });

        expect(synced).toBe(0);
        expect(mockRaceEntryRepository.replaceForRace).not.toHaveBeenCalled();
    });

    it('should skip drivers without a team', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([
            openF1Driver(1, 'NOR', 'McLaren'),
            { ...openF1Driver(99, 'RES', ''), teamName: null as unknown as string },
        ]);

        await useCase.execute(fakeRace, 11369, { updateCurrentTeam: false });

        expect(mockRaceEntryRepository.replaceForRace).toHaveBeenCalledWith('race-1', [
            { driverId: 'driver-1', teamId: 'team-McLaren' },
        ]);
    });

    it('should only add missing drivers to the roster without touching any grid', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([openF1Driver(44, 'HAM', 'Ferrari')]);

        await useCase.addMissingToRoster('season-1', 11365);

        expect(mockDriverRepository.createIfMissing).toHaveBeenCalledWith(expect.objectContaining({ driverNumber: 44 }));
        expect(mockRaceEntryRepository.replaceForRace).not.toHaveBeenCalled();
    });
});
