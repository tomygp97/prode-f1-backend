import { RaceRepository } from "../../domain/ports/race.repository";
import { SeasonRepository } from "../../domain/ports/season.repository";
import { Season } from "../../domain/entities/season.entity";
import { Race } from "../../domain/entities/race.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { ColdStartSyncUseCase } from "./cold-start-sync.use-case";
import { SyncSeasonCalendarUseCase } from "./sync-season-calendar.use-case";
import { SyncUpcomingGridUseCase } from "./sync-upcoming-grid.use-case";

const mockSeasonRepository: jest.Mocked<SeasonRepository> = {
    findByYear: jest.fn(),
    ensureForYear: jest.fn(),
};
const mockRaceRepository = { findAll: jest.fn() } as unknown as jest.Mocked<RaceRepository>;
const mockSyncSeasonCalendar = { execute: jest.fn() } as unknown as jest.Mocked<SyncSeasonCalendarUseCase>;
const mockSyncUpcomingGrid = { execute: jest.fn() } as unknown as jest.Mocked<SyncUpcomingGridUseCase>;

const NOW = new Date('2026-09-25T12:00:00Z');
const season2026 = Season.create({ id: 'season-2026', year: 2026 });

const race = (seasonId: string) => Race.create({
    id: `race-${seasonId}`, seasonId, name: 'GP', circuit: 'c', country: 'x', round: 1,
    qualifyingStartAt: null, raceStartAt: null, status: RaceStatus.SCHEDULED, meetingKey: 1,
    raceSessionKey: null, qualifyingSessionKey: null,
});

describe('ColdStartSyncUseCase', () => {
    let useCase: ColdStartSyncUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ColdStartSyncUseCase(mockSeasonRepository, mockRaceRepository, mockSyncSeasonCalendar, mockSyncUpcomingGrid);
    });

    it('should do nothing when the current season already has races', async () => {
        mockSeasonRepository.findByYear.mockResolvedValue(season2026);
        mockRaceRepository.findAll.mockResolvedValue([race('season-2026')]);

        await expect(useCase.execute(NOW)).resolves.toBe('skipped');
        expect(mockSyncSeasonCalendar.execute).not.toHaveBeenCalled();
    });

    it('should sync calendar and roster on an empty database', async () => {
        mockSeasonRepository.findByYear.mockResolvedValue(null);
        mockRaceRepository.findAll.mockResolvedValue([]);

        await expect(useCase.execute(NOW)).resolves.toBe('synced');
        expect(mockSyncSeasonCalendar.execute).toHaveBeenCalledWith(2026);
        expect(mockSyncUpcomingGrid.execute).toHaveBeenCalledWith(NOW);
    });

    it('should sync when only last season has races (new year)', async () => {
        mockSeasonRepository.findByYear.mockResolvedValue(season2026);
        mockRaceRepository.findAll.mockResolvedValue([race('season-2025')]);

        await expect(useCase.execute(NOW)).resolves.toBe('synced');
        expect(mockSyncSeasonCalendar.execute).toHaveBeenCalledWith(2026);
    });
});
