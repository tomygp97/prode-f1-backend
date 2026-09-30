import { LeagueMemberRepository, UserLeagueMembership } from '../../../domain/ports/league-member.repository';
import { ListUserLeaguesUseCase } from './list-user-leagues.use-case';

const mockMemberRepository: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
    findActiveLeaguesByUser: jest.fn(),
};

describe('ListUserLeaguesUseCase', () => {
    let useCase: ListUserLeaguesUseCase;

    beforeEach(() => {
        useCase = new ListUserLeaguesUseCase(mockMemberRepository);
        jest.clearAllMocks();
    });

    it('should return active leagues for the user', async () => {
        const mockResult: UserLeagueMembership[] = [
            {
                league: {
                    id: 'league-1',
                    name: 'Liga Test',
                    ownerId: 'owner-1',
                    isPublic: false,
                    predictionSlots: 3,
                    seasonId: 'season-1',
                    trackedDriverId: null,
                },
                role: 'admin',
                joinedAt: new Date('2026-03-01T14:30:00.000Z'),
                membersCount: 5,
                inviteCode: 'ABC123',
            },
            {
                league: {
                    id: 'league-2',
                    name: 'Liga Amigos',
                    ownerId: 'owner-2',
                    isPublic: true,
                    predictionSlots: 5,
                    seasonId: 'season-1',
                    trackedDriverId: 'driver-1',
                },
                role: 'member',
                joinedAt: new Date('2026-03-05T10:15:00.000Z'),
                membersCount: 12,
                inviteCode: 'XYZ789',
            },
        ];
        mockMemberRepository.findActiveLeaguesByUser.mockResolvedValue(mockResult);

        const result = await useCase.execute({ userId: 'user-1' });

        expect(mockMemberRepository.findActiveLeaguesByUser).toHaveBeenCalledWith('user-1');
        expect(result).toHaveLength(2);
        expect(result[0].role).toBe('admin');
        expect(result[0].inviteCode).toBe('ABC123');
        expect(result[0].league).not.toHaveProperty('inviteCode');
        expect(result[1].membersCount).toBe(12);
    });

    it('should return an empty array when the user has no active leagues', async () => {
        mockMemberRepository.findActiveLeaguesByUser.mockResolvedValue([]);

        const result = await useCase.execute({ userId: 'user-1' });

        expect(result).toEqual([]);
    });
});
