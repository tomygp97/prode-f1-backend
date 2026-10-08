import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { PredictionScoreRepository } from '../../../domain/ports/prediction-score.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { UserRepository } from '../../../domain/ports/user.repository';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { Race } from '../../../domain/entities/race.entity';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { PredictionScore } from '../../../domain/entities/prediction-score.entity';
import { User } from '../../../domain/entities/user.entity';
import { RaceStatus } from '../../../domain/enums/race-status.enum';
import { ListPredictionsForRaceUseCase } from './list-predictions-for-race.use-case';

const mockPredictionRepo: jest.Mocked<PredictionRepository> = {
    save: jest.fn(),
    findByLeagueRaceAndUser: jest.fn(),
    findAllByLeagueAndRace: jest.fn(),
    findAllByRaceId: jest.fn(),
};

const mockScoreRepo: jest.Mocked<PredictionScoreRepository> = {
    save: jest.fn(),
    findByPredictionId: jest.fn(),
    findByPredictionIds: jest.fn(),
    findAllByLeague: jest.fn(),
};

const mockMemberRepo: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
    findActiveLeaguesByUser: jest.fn(),
};

const mockRaceRepo: jest.Mocked<RaceRepository> = {
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

const mockUserRepo: jest.Mocked<UserRepository> = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
};

const NOW = new Date('2026-10-10T13:05:00Z');
const QUALY = new Date('2026-10-10T13:00:00Z');

const race = (status: RaceStatus, qualifyingStartAt: Date | null = QUALY) => Race.create({
    id: 'race-1', seasonId: 'season-1', name: 'GP Test', circuit: 'Circuit', country: 'Country',
    round: 1, qualifyingStartAt, raceStartAt: null,
    status, meetingKey: 1, raceSessionKey: null, qualifyingSessionKey: null,
});

const member = (userId: string) =>
    LeagueMember.create({ id: `member-${userId}`, leagueId: 'league-1', userId, role: 'member' });

const user = (id: string, name: string) => User.create({ id, email: `${id}@test.com`, password: 'x', name });

const prediction = (userId: string) => Prediction.create({
    id: `p-${userId}`, userId, leagueId: 'league-1', raceId: 'race-1',
    predictedOrder: ['d1', 'd2', 'd3'], predictedPoleDriverId: 'd1', safetyCar: true, dnfCount: 0,
});

const score = (userId: string, positions: number) => PredictionScore.create({
    id: `s-${userId}`, predictionId: `p-${userId}`,
    pointsBreakdown: { positions, safetyCar: 0, dnfCount: 0, pole: 0, trackedDriver: 0 },
});

describe('ListPredictionsForRaceUseCase', () => {
    let useCase: ListPredictionsForRaceUseCase;

    beforeEach(() => {
        useCase = new ListPredictionsForRaceUseCase(
            mockPredictionRepo, mockScoreRepo, mockMemberRepo, mockRaceRepo, mockUserRepo,
        );
        jest.clearAllMocks();
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(member('user-1'));
    });

    const execute = () => useCase.execute({ leagueId: 'league-1', raceId: 'race-1', requesterId: 'user-1' }, NOW);

    it('should list every active member with name, prediction and score, sorted', async () => {
        mockRaceRepo.findById.mockResolvedValue(race(RaceStatus.RESULTS_SYNCED));
        mockMemberRepo.findActiveMembersByLeague.mockResolvedValue([
            member('user-1'), member('user-2'), member('user-3'), member('user-4'),
        ]);
        mockUserRepo.findByIds.mockResolvedValue([
            user('user-1', 'Tomas'), user('user-2', 'Juan'), user('user-3', 'Lucia'), user('user-4', 'Martin'),
        ]);
        // Martin no cargó; Lucia cargó pero todavía sin puntos
        mockPredictionRepo.findAllByLeagueAndRace.mockResolvedValue([
            prediction('user-1'), prediction('user-2'), prediction('user-3'),
        ]);
        mockScoreRepo.findByPredictionIds.mockResolvedValue([score('user-1', 17), score('user-2', 71)]);

        const result = await execute();

        expect(result.raceId).toBe('race-1');
        expect(result.entries.map((e) => [e.name, e.score?.totalPoints ?? null, e.prediction !== null])).toEqual([
            ['Juan', 71, true],
            ['Tomas', 17, true],
            ['Lucia', null, true],
            ['Martin', null, false],
        ]);
        expect(mockScoreRepo.findByPredictionIds).toHaveBeenCalledWith(['p-user-1', 'p-user-2', 'p-user-3']);
    });

    it('should be visible as soon as qualifying starts, even if the status is still SCHEDULED', async () => {
        mockRaceRepo.findById.mockResolvedValue(race(RaceStatus.SCHEDULED));
        mockMemberRepo.findActiveMembersByLeague.mockResolvedValue([member('user-1')]);
        mockUserRepo.findByIds.mockResolvedValue([user('user-1', 'Tomas')]);
        mockPredictionRepo.findAllByLeagueAndRace.mockResolvedValue([prediction('user-1')]);
        mockScoreRepo.findByPredictionIds.mockResolvedValue([]);

        const result = await execute();

        expect(result.entries).toEqual([
            expect.objectContaining({ userId: 'user-1', name: 'Tomas', score: null }),
        ]);
    });

    it('should throw while predictions are still open', async () => {
        mockRaceRepo.findById.mockResolvedValue(race(RaceStatus.SCHEDULED, new Date('2026-10-10T14:00:00Z')));

        await expect(execute()).rejects.toThrow('Predictions for this race are not visible yet');

        expect(mockPredictionRepo.findAllByLeagueAndRace).not.toHaveBeenCalled();
    });

    it('should throw if requester is not an active member', async () => {
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(null);

        await expect(execute()).rejects.toThrow('You must be an active member of this league to view predictions');

        expect(mockRaceRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw if race does not exist', async () => {
        mockRaceRepo.findById.mockResolvedValue(null);

        await expect(execute()).rejects.toThrow('Race not found');
    });
});
