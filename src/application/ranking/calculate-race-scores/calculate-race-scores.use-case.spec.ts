import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { PredictionScoreRepository } from '../../../domain/ports/prediction-score.repository';
import { LeagueRankingRepository } from '../../../domain/ports/league-ranking.repository';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { RaceResultRepository } from '../../../domain/ports/race-result.repository';
import { RaceDriverResultRepository } from '../../../domain/ports/race-driver-result.repository';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { RaceResult } from '../../../domain/entities/race-result.entity';
import { RaceDriverResult } from '../../../domain/entities/race-driver-result.entity';
import { League } from '../../../domain/entities/league.entity';
import { LeagueRanking } from '../../../domain/entities/league-ranking.entity';
import { CalculateRaceScoresUseCase } from './calculate-race-scores.use-case';

const mockPredictionRepo: jest.Mocked<PredictionRepository> = {
    save: jest.fn(),
    findByLeagueRaceAndUser: jest.fn(),
    findAllByLeagueAndRace: jest.fn(),
    findAllByRaceId: jest.fn(),
};

const mockScoreRepo: jest.Mocked<PredictionScoreRepository> = {
    save: jest.fn(),
    findByPredictionId: jest.fn(),
};

const mockRankingRepo: jest.Mocked<LeagueRankingRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findAllByLeague: jest.fn(),
};

const mockLeagueRepo: jest.Mocked<LeagueRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPublicLeaguesWithMemberCount: jest.fn(),
    createWithOwner: jest.fn(),
    transferOwnership: jest.fn(),
};

const mockRaceResultRepo: jest.Mocked<RaceResultRepository> = {
    upsert: jest.fn(),
    findByRaceId: jest.fn(),
};

const mockDriverResultRepo: jest.Mocked<RaceDriverResultRepository> = {
    replaceMany: jest.fn(),
    findByRaceId: jest.fn(),
};

describe('CalculateRaceScoresUseCase', () => {
    let useCase: CalculateRaceScoresUseCase;

    const raceResult = (overrides: Partial<{ safetyCar: boolean; dnfCount: number }> = {}) => RaceResult.create({
        id: 'result-1', raceId: 'race-1', poleDriverId: 'd1', raceWinnerDriverId: 'd1',
        raceWinnerTeamId: 'team-1', safetyCar: overrides.safetyCar ?? true, dnfCount: overrides.dnfCount ?? 3,
        syncedAt: new Date(),
    });

    const driverResults = () => [
        RaceDriverResult.create({ id: 'dr1', raceId: 'race-1', driverId: 'd1', position: 1, dnf: false }),
        RaceDriverResult.create({ id: 'dr2', raceId: 'race-1', driverId: 'd2', position: 2, dnf: false }),
        RaceDriverResult.create({ id: 'dr3', raceId: 'race-1', driverId: 'd3', position: 4, dnf: false }),
    ];

    const league = (trackedDriverId: string | null = null) => League.create({
        id: 'league-1', name: 'Liga Test', ownerId: 'owner-1', inviteCode: 'ABC123',
        isPublic: true, predictionSlots: 3, seasonId: 'season-1', trackedDriverId,
    });

    const prediction = (overrides: Partial<{ predictedOrder: string[]; safetyCar: boolean; dnfCount: number; trackedDriverPosition: number | null }> = {}) =>
        Prediction.create({
            id: 'prediction-1', userId: 'user-1', leagueId: 'league-1', raceId: 'race-1',
            predictedOrder: overrides.predictedOrder ?? ['d1', 'd2', 'd3'],
            safetyCar: overrides.safetyCar ?? true,
            dnfCount: overrides.dnfCount ?? 3,
            trackedDriverPosition: overrides.trackedDriverPosition ?? null,
        });

    beforeEach(() => {
        useCase = new CalculateRaceScoresUseCase(
            mockPredictionRepo, mockScoreRepo, mockRankingRepo, mockLeagueRepo, mockRaceResultRepo, mockDriverResultRepo,
        );
        jest.clearAllMocks();
    });

    it('should throw if race result does not exist', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(null);

        await expect(useCase.execute('race-1')).rejects.toThrow('Race result not found for race race-1');
    });

    it('should skip predictions that already have a score', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(raceResult());
        mockDriverResultRepo.findByRaceId.mockResolvedValue(driverResults());
        mockPredictionRepo.findAllByRaceId.mockResolvedValue([prediction()]);
        mockScoreRepo.findByPredictionId.mockResolvedValue({ id: 'existing-score' } as any);

        await useCase.execute('race-1');

        expect(mockScoreRepo.save).not.toHaveBeenCalled();
        expect(mockRankingRepo.save).not.toHaveBeenCalled();
    });

    it('should calculate full score: winner exact, position off by one, safety car exact, dnf exact', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(raceResult({ safetyCar: true, dnfCount: 3 }));
        mockDriverResultRepo.findByRaceId.mockResolvedValue(driverResults());
        mockPredictionRepo.findAllByRaceId.mockResolvedValue([
            prediction({ predictedOrder: ['d1', 'd3', 'd2'], safetyCar: true, dnfCount: 3 }),
        ]);
        mockScoreRepo.findByPredictionId.mockResolvedValue(null);
        mockLeagueRepo.findById.mockResolvedValue(league());
        mockRankingRepo.findByLeagueAndUser.mockResolvedValue(null);

        await useCase.execute('race-1');

        // d1 predicho en P1, real P1 -> winner exacto = 25
        // d3 predicho en P2, real P4 -> diff 2 -> 0
        // d2 predicho en P3, real P2 -> diff 1 -> 3
        // safetyCar exacto = 5, dnf exacto = 10
        // total = 25 + 0 + 3 + 5 + 10 = 43
        const [savedScore] = mockScoreRepo.save.mock.calls[0];
        expect(savedScore.totalPoints).toBe(43);
    });

    it('should award dnf off-by-one points', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(raceResult({ dnfCount: 3 }));
        mockDriverResultRepo.findByRaceId.mockResolvedValue(driverResults());
        mockPredictionRepo.findAllByRaceId.mockResolvedValue([
            prediction({ predictedOrder: ['d1', 'd2', 'd3'], dnfCount: 4 }),
        ]);
        mockScoreRepo.findByPredictionId.mockResolvedValue(null);
        mockLeagueRepo.findById.mockResolvedValue(league());
        mockRankingRepo.findByLeagueAndUser.mockResolvedValue(null);

        await useCase.execute('race-1');

        const [savedScore] = mockScoreRepo.save.mock.calls[0];
        expect(savedScore.pointsBreakdown.dnfCount).toBe(5); // margen ±1
    });

    it('should award tracked driver exact points and not off-by-one on top', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(raceResult());
        mockDriverResultRepo.findByRaceId.mockResolvedValue(driverResults()); // d3 termina en posición 4
        mockPredictionRepo.findAllByRaceId.mockResolvedValue([
            prediction({ trackedDriverPosition: 4 }),
        ]);
        mockScoreRepo.findByPredictionId.mockResolvedValue(null);
        mockLeagueRepo.findById.mockResolvedValue(league('d3'));
        mockRankingRepo.findByLeagueAndUser.mockResolvedValue(null);

        await useCase.execute('race-1');

        const [savedScore] = mockScoreRepo.save.mock.calls[0];
        expect(savedScore.pointsBreakdown.trackedDriver).toBe(10); // solo el exacto, no se acumula
    });

    it('should create a new LeagueRanking if none exists, and set racesCounted to 1', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(raceResult());
        mockDriverResultRepo.findByRaceId.mockResolvedValue(driverResults());
        mockPredictionRepo.findAllByRaceId.mockResolvedValue([prediction()]);
        mockScoreRepo.findByPredictionId.mockResolvedValue(null);
        mockLeagueRepo.findById.mockResolvedValue(league());
        mockRankingRepo.findByLeagueAndUser.mockResolvedValue(null);

        await useCase.execute('race-1');

        const [savedRanking] = mockRankingRepo.save.mock.calls[0];
        expect(savedRanking.racesCounted).toBe(1);
    });

    it('should accumulate points on an existing LeagueRanking', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(raceResult());
        mockDriverResultRepo.findByRaceId.mockResolvedValue(driverResults());
        mockPredictionRepo.findAllByRaceId.mockResolvedValue([prediction()]);
        mockScoreRepo.findByPredictionId.mockResolvedValue(null);
        mockLeagueRepo.findById.mockResolvedValue(league());
        mockRankingRepo.findByLeagueAndUser.mockResolvedValue(
            LeagueRanking.create({ id: 'ranking-1', leagueId: 'league-1', userId: 'user-1', totalPoints: 20, racesCounted: 1 }),
        );

        await useCase.execute('race-1');

        const [savedRanking] = mockRankingRepo.save.mock.calls[0];
        expect(savedRanking.racesCounted).toBe(2);
        expect(savedRanking.totalPoints).toBeGreaterThan(20); // se sumó al total previo
    });

    it('should skip prediction if its league no longer exists', async () => {
        mockRaceResultRepo.findByRaceId.mockResolvedValue(raceResult());
        mockDriverResultRepo.findByRaceId.mockResolvedValue(driverResults());
        mockPredictionRepo.findAllByRaceId.mockResolvedValue([prediction()]);
        mockScoreRepo.findByPredictionId.mockResolvedValue(null);
        mockLeagueRepo.findById.mockResolvedValue(null);

        await useCase.execute('race-1');

        expect(mockScoreRepo.save).not.toHaveBeenCalled();
    });
});