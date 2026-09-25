import { SeasonRepository } from "../../domain/ports/season.repository";
import { Season } from "../../domain/entities/season.entity";
import { SyncCalendarUseCase } from "./sync-calendar.use-case";
import { SyncSeasonCalendarUseCase } from "./sync-season-calendar.use-case";

const mockSeasonRepository: jest.Mocked<SeasonRepository> = {
    findByYear: jest.fn(),
    ensureForYear: jest.fn(),
};
const mockSyncCalendar = { execute: jest.fn() } as unknown as jest.Mocked<SyncCalendarUseCase>;

describe('SyncSeasonCalendarUseCase', () => {
    let useCase: SyncSeasonCalendarUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new SyncSeasonCalendarUseCase(mockSeasonRepository, mockSyncCalendar);
        mockSeasonRepository.ensureForYear.mockImplementation(async (year) => Season.create({ id: `season-${year}`, year }));
        mockSyncCalendar.execute.mockResolvedValue([]);
    });

    it('should ensure the season of the year and sync its calendar with that season id', async () => {
        const result = await useCase.execute(2027);

        expect(mockSeasonRepository.ensureForYear).toHaveBeenCalledWith(2027);
        expect(mockSyncCalendar.execute).toHaveBeenCalledWith(2027, 'season-2027');
        expect(result.season.year).toBe(2027);
    });

    it('should use the current year by default', async () => {
        await useCase.execute();

        expect(mockSeasonRepository.ensureForYear).toHaveBeenCalledWith(new Date().getUTCFullYear());
    });
});
