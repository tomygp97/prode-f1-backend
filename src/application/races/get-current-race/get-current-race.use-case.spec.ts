import { RaceRepository } from "../../../domain/ports/race.repository";
import { Race } from "../../../domain/entities/race.entity";
import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { GetCurrentRaceUseCase } from "./get-current-race.use-case";

const mockRaceRepository = { findAll: jest.fn() } as unknown as jest.Mocked<RaceRepository>;

// Sábado 26/9 a las 12:00 UTC: qualy de Bakú el sábado a las 12:00, carrera el domingo 11:00
const race = (id: string, status: RaceStatus, qualy: string, start: string) => Race.create({
    id, seasonId: 'season-1', name: `GP ${id}`, circuit: 'c', country: 'x', round: 1,
    qualifyingStartAt: new Date(qualy), raceStartAt: new Date(start), status,
    meetingKey: 1, raceSessionKey: 1, qualifyingSessionKey: 2,
});

const spain = race('spain', RaceStatus.RESULTS_SYNCED, '2026-09-12T14:00:00Z', '2026-09-13T13:00:00Z');
const bakuLocked = race('baku', RaceStatus.LOCKED, '2026-09-26T12:00:00Z', '2026-09-27T11:00:00Z');
const bahrain = race('bahrain', RaceStatus.SCHEDULED, '2026-10-03T08:00:00Z', '2026-10-04T07:00:00Z');

describe('GetCurrentRaceUseCase', () => {
    let useCase: GetCurrentRaceUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetCurrentRaceUseCase(mockRaceRepository);
    });

    it('should return the race whose weekend is in progress (qualifying started, no results yet)', async () => {
        mockRaceRepository.findAll.mockResolvedValue([spain, bakuLocked, bahrain]);

        const result = await useCase.execute(new Date('2026-09-26T13:00:00Z'));

        expect(result?.id).toBe('baku');
    });

    it('should include a race still SCHEDULED once qualifying has started (before the cron locks it)', async () => {
        const bakuScheduled = race('baku', RaceStatus.SCHEDULED, '2026-09-26T12:00:00Z', '2026-09-27T11:00:00Z');
        mockRaceRepository.findAll.mockResolvedValue([spain, bakuScheduled, bahrain]);

        const result = await useCase.execute(new Date('2026-09-26T12:01:00Z'));

        expect(result?.id).toBe('baku');
    });

    it('should keep the race while results are being processed (FINISHED)', async () => {
        const bakuFinished = race('baku', RaceStatus.FINISHED, '2026-09-26T12:00:00Z', '2026-09-27T11:00:00Z');
        mockRaceRepository.findAll.mockResolvedValue([bakuFinished, bahrain]);

        const result = await useCase.execute(new Date('2026-09-27T13:30:00Z'));

        expect(result?.id).toBe('baku');
    });

    it('should return null outside a race weekend', async () => {
        mockRaceRepository.findAll.mockResolvedValue([spain, bahrain]);

        await expect(useCase.execute(new Date('2026-09-30T12:00:00Z'))).resolves.toBeNull();
    });

    it('should drop a race stuck without results a few days after it started', async () => {
        mockRaceRepository.findAll.mockResolvedValue([bakuLocked, bahrain]);

        await expect(useCase.execute(new Date('2026-10-01T12:00:00Z'))).resolves.toBeNull();
    });
});
