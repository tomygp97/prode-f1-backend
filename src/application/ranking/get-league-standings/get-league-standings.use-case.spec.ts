import { ForbiddenException } from '@nestjs/common';
import { LeagueRankingRepository } from '../../../domain/ports/league-ranking.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueRaceScoreEntry, PredictionScoreRepository } from '../../../domain/ports/prediction-score.repository';
import { UserRepository } from '../../../domain/ports/user.repository';
import { LeagueRanking } from '../../../domain/entities/league-ranking.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { User } from '../../../domain/entities/user.entity';
import { GetLeagueStandingsUseCase } from './get-league-standings.use-case';

const mockRankingRepo: jest.Mocked<LeagueRankingRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findAllByLeague: jest.fn(),
};

const mockMemberRepo: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
    findActiveLeaguesByUser: jest.fn(),
};

const mockScoreRepo: jest.Mocked<PredictionScoreRepository> = {
    save: jest.fn(),
    findByPredictionId: jest.fn(),
    findAllByLeague: jest.fn(),
};

const mockUserRepo: jest.Mocked<UserRepository> = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
};

describe('GetLeagueStandingsUseCase', () => {
    let useCase: GetLeagueStandingsUseCase;

    const member = (userId: string) => LeagueMember.create({
        id: `member-${userId}`, leagueId: 'league-1', userId, role: 'member',
    });

    const ranking = (userId: string, totalPoints: number) => LeagueRanking.create({
        id: `ranking-${userId}`, leagueId: 'league-1', userId, totalPoints, racesCounted: 3,
    });

    const user = (id: string) => User.create({ id, email: `${id}@test.com`, password: 'hash', name: `Name ${id}` });

    const score = (userId: string, round: number, totalPoints: number): LeagueRaceScoreEntry => ({
        userId, raceId: `race-${round}`, round, totalPoints,
    });

    // Escenario base: el requester (user-1) es miembro activo y cada miembro tiene un User
    function givenLeague(userIds: string[], rankings: LeagueRanking[], scores: LeagueRaceScoreEntry[] = []) {
        mockMemberRepo.findActiveMembersByLeague.mockResolvedValue(userIds.map(member));
        mockRankingRepo.findAllByLeague.mockResolvedValue(rankings);
        mockScoreRepo.findAllByLeague.mockResolvedValue(scores);
        mockUserRepo.findByIds.mockResolvedValue(userIds.map(user));
    }

    beforeEach(() => {
        useCase = new GetLeagueStandingsUseCase(mockRankingRepo, mockMemberRepo, mockScoreRepo, mockUserRepo);
        jest.clearAllMocks();
    });

    it('should throw ForbiddenException if the requester is not an active member', async () => {
        givenLeague(['user-2', 'user-3'], []);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' }),
        ).rejects.toThrow(ForbiddenException);
        expect(mockRankingRepo.findAllByLeague).not.toHaveBeenCalled();
    });

    it('should list active members with 0 points when there are no rankings yet', async () => {
        givenLeague(['user-1', 'user-2'], []);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result).toHaveLength(2);
        expect(result.every((s) => s.totalPoints === 0 && s.rank === 1)).toBe(true);
    });

    it('should return user names and exclude users that are no longer members', async () => {
        // user-3 tiene ranking pero dejó la liga: no está entre los miembros activos
        givenLeague(['user-1', 'user-2'], [ranking('user-1', 50), ranking('user-2', 40), ranking('user-3', 90)]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result.map((s) => s.userId)).toEqual(['user-1', 'user-2']);
        expect(result[0]).toMatchObject({ rank: 1, userName: 'Name user-1', totalPoints: 50, racesCounted: 3 });
    });

    it('should assign sequential ranks when there are no ties', async () => {
        givenLeague(['user-1', 'user-2', 'user-3'], [
            ranking('user-1', 100),
            ranking('user-2', 80),
            ranking('user-3', 60),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result[0]).toMatchObject({ rank: 1, userId: 'user-1' });
        expect(result[1]).toMatchObject({ rank: 2, userId: 'user-2' });
        expect(result[2]).toMatchObject({ rank: 3, userId: 'user-3' });
    });

    it('should apply competition ranking when there is a tie (skip the next rank)', async () => {
        givenLeague(['user-1', 'user-2', 'user-3', 'user-4'], [
            ranking('user-1', 100),
            ranking('user-2', 90),
            ranking('user-3', 90), // empatado con user-2
            ranking('user-4', 80),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result.map((s) => s.rank)).toEqual([1, 2, 2, 4]);
    });

    it('should count race wins per round, giving the win to everyone tied on top', async () => {
        givenLeague(['user-1', 'user-2'], [ranking('user-1', 70), ranking('user-2', 60)], [
            score('user-1', 1, 40), score('user-2', 1, 30), // gana user-1
            score('user-1', 2, 30), score('user-2', 2, 30), // empate: ganan los dos
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result.find((s) => s.userId === 'user-1')?.raceWins).toBe(2);
        expect(result.find((s) => s.userId === 'user-2')?.raceWins).toBe(1);
    });

    it('should set the trend comparing against the standings before the last round', async () => {
        // Antes de la fecha 2: user-1 primero. Después: user-2 lo pasa.
        givenLeague(['user-1', 'user-2'], [ranking('user-1', 45), ranking('user-2', 60)], [
            score('user-1', 1, 40), score('user-2', 1, 10),
            score('user-1', 2, 5), score('user-2', 2, 50),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result.find((s) => s.userId === 'user-2')?.trend).toBe('up');
        expect(result.find((s) => s.userId === 'user-1')?.trend).toBe('down');
    });
});
