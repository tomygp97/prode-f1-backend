import { Race } from "../../domain/entities/race.entity";
import { RaceStatus } from "../../domain/enums/race-status.enum";
import { CalculateRaceScoresUseCase } from "../ranking/calculate-race-scores/calculate-race-scores.use-case";
import { SyncRaceResultsUseCase } from "./sync-race-results.use-case";
import { ResyncRecentResultsUseCase } from "./resync-recent-results.use-case";
import { mockRaceRepository } from "../../../test/mocks/race-repository.mock";

const mockSyncRaceResults = { execute: jest.fn() } as unknown as jest.Mocked<SyncRaceResultsUseCase>;
const mockCalculateRaceScores = { execute: jest.fn() } as unknown as jest.Mocked<CalculateRaceScoresUseCase>;

const NOW = new Date('2026-10-13T12:00:00Z');

const race = (id: string) => Race.create({
    id, seasonId: 'season-1', name: `GP ${id}`, circuit: 'C', country: 'X', round: 1,
    qualifyingStartAt: null, raceStartAt: new Date('2026-10-11T12:00:00Z'),
    status: RaceStatus.RESULTS_SYNCED, meetingKey: 1, raceSessionKey: 10, qualifyingSessionKey: 11,
});

describe('ResyncRecentResultsUseCase', () => {
    let useCase: ResyncRecentResultsUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new ResyncRecentResultsUseCase(mockRaceRepository, mockSyncRaceResults, mockCalculateRaceScores);
    });

    it('should look for races with results from the last 7 days', async () => {
        mockRaceRepository.findResultsSyncedSince.mockResolvedValue([]);

        await useCase.execute(NOW);

        expect(mockRaceRepository.findResultsSyncedSince).toHaveBeenCalledWith(new Date('2026-10-06T12:00:00Z'));
    });

    it('should recalculate scores only for the races whose result changed', async () => {
        mockRaceRepository.findResultsSyncedSince.mockResolvedValue([race('a'), race('b')]);
        mockSyncRaceResults.execute
            .mockResolvedValueOnce({ firstSync: false, changes: [] })
            .mockResolvedValueOnce({ firstSync: false, changes: ['LEC P2→P1', 'VER P1→P2'] });

        const changed = await useCase.execute(NOW);

        expect(mockCalculateRaceScores.execute).toHaveBeenCalledTimes(1);
        // El motivo queda registrado en la carrera
        expect(mockCalculateRaceScores.execute).toHaveBeenCalledWith('b', {
            reason: 'Resultado oficial actualizado: LEC P2→P1, VER P1→P2',
        });
        expect(changed).toEqual([{ raceId: 'b', name: 'GP b', changes: ['LEC P2→P1', 'VER P1→P2'] }]);
    });

    it('should keep going with the next race when one fails', async () => {
        mockRaceRepository.findResultsSyncedSince.mockResolvedValue([race('a'), race('b')]);
        mockSyncRaceResults.execute
            .mockRejectedValueOnce(new Error('OpenF1 down'))
            .mockResolvedValueOnce({ firstSync: false, changes: ['DNF 2→3'] });

        const changed = await useCase.execute(NOW);

        expect(changed.map((r) => r.raceId)).toEqual(['b']);
    });
});
