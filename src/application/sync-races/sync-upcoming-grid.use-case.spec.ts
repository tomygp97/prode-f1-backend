import { DriverRepository } from "../../domain/ports/driver.repository";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { RaceRepository } from "../../domain/ports/race.repository";
import { Race } from "../../domain/entities/race.entity";
import { Driver } from "../../domain/entities/driver.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { SyncRaceEntriesUseCase } from "./sync-race-entries.use-case";
import { SyncUpcomingGridUseCase } from "./sync-upcoming-grid.use-case";

const mockRaceRepository = { findAll: jest.fn() } as unknown as jest.Mocked<RaceRepository>;
const mockDriverRepository = { findAll: jest.fn() } as unknown as jest.Mocked<DriverRepository>;
const mockOfficialResultsProvider = { getLatestStartedSessionKey: jest.fn() } as unknown as jest.Mocked<OfficialResultsProvider>;
const mockSyncRaceEntries = {
    execute: jest.fn(),
    addMissingToRoster: jest.fn(),
} as unknown as jest.Mocked<SyncRaceEntriesUseCase>;

const NOW = new Date('2026-09-25T15:00:00Z');

const race = (id: string, status: RaceStatus, raceStartAt: string, meetingKey: number) => Race.create({
    id, seasonId: 'season-1', name: `GP ${id}`, circuit: 'c', country: 'x', round: 1,
    qualifyingStartAt: null, raceStartAt: new Date(raceStartAt), status, meetingKey,
    raceSessionKey: null, qualifyingSessionKey: null,
});

const driverOfSeason = Driver.create({
    id: 'driver-1', name: 'NOR', acronym: 'NOR', driverNumber: 1, seasonId: 'season-1', teamId: 'team-1',
});

describe('SyncUpcomingGridUseCase', () => {
    let useCase: SyncUpcomingGridUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new SyncUpcomingGridUseCase(mockRaceRepository, mockDriverRepository, mockOfficialResultsProvider, mockSyncRaceEntries);
        mockSyncRaceEntries.execute.mockResolvedValue(22);
    });

    it('should sync the grid of the upcoming race from its latest started session', async () => {
        mockRaceRepository.findAll.mockResolvedValue([
            race('spain', RaceStatus.RESULTS_SYNCED, '2026-09-13T13:00:00Z', 1294),
            race('bahrain', RaceStatus.SCHEDULED, '2026-10-04T07:00:00Z', 1308),
            race('baku', RaceStatus.LOCKED, '2026-09-26T11:00:00Z', 1295), // qualy ya empezó
        ]);
        mockOfficialResultsProvider.getLatestStartedSessionKey.mockResolvedValue(11373);

        const result = await useCase.execute(NOW);

        expect(mockOfficialResultsProvider.getLatestStartedSessionKey).toHaveBeenCalledWith({ meetingKey: 1295 });
        expect(mockSyncRaceEntries.execute).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'baku' }), 11373, { updateCurrentTeam: true },
        );
        expect(result).toEqual({ kind: 'synced', raceName: 'GP baku', sessionKey: 11373, drivers: 22 });
    });

    it('should skip a LOCKED race long after its start (results never arrived)', async () => {
        mockRaceRepository.findAll.mockResolvedValue([
            race('stuck', RaceStatus.LOCKED, '2026-09-13T13:00:00Z', 1294),
            race('bahrain', RaceStatus.SCHEDULED, '2026-10-04T07:00:00Z', 1308),
        ]);
        mockOfficialResultsProvider.getLatestStartedSessionKey.mockResolvedValue(11727);

        await useCase.execute(NOW);

        expect(mockOfficialResultsProvider.getLatestStartedSessionKey).toHaveBeenCalledWith({ meetingKey: 1308 });
    });

    it('should do nothing when the weekend has not started and the roster already exists', async () => {
        mockRaceRepository.findAll.mockResolvedValue([race('bahrain', RaceStatus.SCHEDULED, '2026-10-04T07:00:00Z', 1308)]);
        mockOfficialResultsProvider.getLatestStartedSessionKey.mockResolvedValue(null);
        mockDriverRepository.findAll.mockResolvedValue([driverOfSeason]);

        const result = await useCase.execute(NOW);

        expect(result.kind).toBe('skipped');
        expect(mockSyncRaceEntries.execute).not.toHaveBeenCalled();
        expect(mockSyncRaceEntries.addMissingToRoster).not.toHaveBeenCalled();
    });

    it('should bootstrap the roster from the latest session of the year on a cold start', async () => {
        mockRaceRepository.findAll.mockResolvedValue([race('bahrain', RaceStatus.SCHEDULED, '2026-10-04T07:00:00Z', 1308)]);
        mockOfficialResultsProvider.getLatestStartedSessionKey
            .mockResolvedValueOnce(null)      // el fin de semana no empezó
            .mockResolvedValueOnce(11369);    // última sesión del año
        mockDriverRepository.findAll.mockResolvedValue([]);

        const result = await useCase.execute(NOW);

        expect(mockOfficialResultsProvider.getLatestStartedSessionKey).toHaveBeenLastCalledWith({ year: 2026 });
        expect(mockSyncRaceEntries.addMissingToRoster).toHaveBeenCalledWith('season-1', 11369);
        expect(result).toEqual({ kind: 'roster-bootstrapped', sessionKey: 11369 });
    });

    it('should skip when there is no upcoming race', async () => {
        mockRaceRepository.findAll.mockResolvedValue([race('spain', RaceStatus.RESULTS_SYNCED, '2026-09-13T13:00:00Z', 1294)]);

        const result = await useCase.execute(NOW);

        expect(result).toEqual({ kind: 'skipped', reason: 'No upcoming race' });
    });
});
