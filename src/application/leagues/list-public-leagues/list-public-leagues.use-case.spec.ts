import { LeagueRepository, PublicLeagueWithMemberCount } from '../../../domain/ports/league.repository';
import { League } from '../../../domain/entities/league.entity';
import { ListPublicLeaguesUseCase } from './list-public-leagues.use-case';

const mockLeagueRepository: jest.Mocked<LeagueRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPublicLeaguesWithMemberCount: jest.fn(),
    createWithOwner: jest.fn(),
    transferOwnership: jest.fn(),
};

describe('ListPublicLeaguesUseCase', () => {
    let useCase: ListPublicLeaguesUseCase;

    beforeEach(() => {
        useCase = new ListPublicLeaguesUseCase(mockLeagueRepository);
        jest.clearAllMocks();
    });

    it('should return public leagues with their member count', async () => {
        const mockResult: PublicLeagueWithMemberCount[] = [
            {
                league: League.create({
                    id: 'league-1', name: 'Liga Pública 1', ownerId: 'owner-1',
                    inviteCode: 'ABC123', isPublic: true, seasonId: 'season-1',
                }),
                memberCount: 5,
            },
            {
                league: League.create({
                    id: 'league-2', name: 'Liga Pública 2', ownerId: 'owner-2',
                    inviteCode: 'XYZ789', isPublic: true, seasonId: 'season-1',
                }),
                memberCount: 12,
            },
        ];
        mockLeagueRepository.findPublicLeaguesWithMemberCount.mockResolvedValue(mockResult);

        const result = await useCase.execute();

        expect(result).toHaveLength(2);
        expect(result[0].memberCount).toBe(5);
        expect(result[1].league.name).toBe('Liga Pública 2');
    });

    it('should return an empty array when there are no public leagues', async () => {
        mockLeagueRepository.findPublicLeaguesWithMemberCount.mockResolvedValue([]);

        const result = await useCase.execute();

        expect(result).toEqual([]);
    });
});