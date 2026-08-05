import { LeagueRankingRepository } from '../../../domain/ports/league-ranking.repository';
import { LeagueRanking } from '../../../domain/entities/league-ranking.entity';
import { GetLeagueStandingsUseCase } from './get-league-standings.use-case';

const mockRankingRepo: jest.Mocked<LeagueRankingRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findAllByLeague: jest.fn(),
};

describe('GetLeagueStandingsUseCase', () => {
    let useCase: GetLeagueStandingsUseCase;

    const ranking = (userId: string, totalPoints: number) => LeagueRanking.create({
        id: `ranking-${userId}`, leagueId: 'league-1', userId, totalPoints, racesCounted: 3,
    });

    beforeEach(() => {
        useCase = new GetLeagueStandingsUseCase(mockRankingRepo);
        jest.clearAllMocks();
    });

    it('should return an empty array if there are no rankings yet', async () => {
        mockRankingRepo.findAllByLeague.mockResolvedValue([]);

        const result = await useCase.execute({ leagueId: 'league-1' });

        expect(result).toEqual([]);
    });

    it('should assign sequential ranks when there are no ties', async () => {
        mockRankingRepo.findAllByLeague.mockResolvedValue([
            ranking('user-1', 100),
            ranking('user-2', 80),
            ranking('user-3', 60),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1' });

        expect(result[0]).toMatchObject({ rank: 1, ranking: { userId: 'user-1' } });
        expect(result[1]).toMatchObject({ rank: 2, ranking: { userId: 'user-2' } });
        expect(result[2]).toMatchObject({ rank: 3, ranking: { userId: 'user-3' } });
    });

    it('should apply competition ranking when there is a tie (skip the next rank)', async () => {
        mockRankingRepo.findAllByLeague.mockResolvedValue([
            ranking('user-1', 100),
            ranking('user-2', 90),
            ranking('user-3', 90), // empatado con user-2
            ranking('user-4', 80),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1' });

        expect(result[0].rank).toBe(1); // user-1
        expect(result[1].rank).toBe(2); // user-2, 90pts
        expect(result[2].rank).toBe(2); // user-3, empatado, mismo rank
        expect(result[3].rank).toBe(4); // user-4, salta el rank 3
    });
});