import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { toLeagueView } from '../../../domain/views/league.view';
import { GetLeagueByIdUseCase } from './get-league-by-id.use-case';

const mockLeagueRepository: jest.Mocked<LeagueRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPublicLeaguesWithMemberCount: jest.fn(),
    createWithOwner: jest.fn(),
    transferOwnership: jest.fn(),
};

const mockMemberRepository: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
    findActiveLeaguesByUser: jest.fn(),
};

describe('GetLeagueByIdUseCase', () => {
    let useCase: GetLeagueByIdUseCase;

    const league = League.create({
        id: 'league-1',
        name: 'Liga Test',
        ownerId: 'owner-1',
        inviteCode: 'ABC123',
        isPublic: true,
        seasonId: 'season-1',
    });

    beforeEach(() => {
        useCase = new GetLeagueByIdUseCase(mockLeagueRepository, mockMemberRepository);
        jest.clearAllMocks();
    });

    it('should return league detail for a public league without requiring membership', async () => {
        mockLeagueRepository.findById.mockResolvedValue(league);
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);
        mockMemberRepository.findActiveMembersByLeague.mockResolvedValue([
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'owner-1', role: 'admin' }),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'stranger-1' });

        expect(result).toEqual({
            league: toLeagueView(league),
            role: null,
            membersCount: 1,
            inviteCode: null,
        });
        expect(result.league).not.toHaveProperty('inviteCode');
    });

    it('should throw if league does not exist', async () => {
        mockLeagueRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' }),
        ).rejects.toThrow('League not found');
    });

    it('should throw if league is private and requester is not a member', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1',
                name: 'Liga Test',
                ownerId: 'owner-1',
                inviteCode: 'ABC123',
                isPublic: false,
                seasonId: 'season-1',
            }),
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'stranger-1' }),
        ).rejects.toThrow('You must be a member of this league to view it');

        expect(mockMemberRepository.findActiveMembersByLeague).not.toHaveBeenCalled();
    });

    it('should return league detail with role and invite code for an active member', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1',
                name: 'Liga Test',
                ownerId: 'owner-1',
                inviteCode: 'ABC123',
                isPublic: false,
                seasonId: 'season-1',
            }),
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member' }),
        );
        mockMemberRepository.findActiveMembersByLeague.mockResolvedValue([
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member' }),
            LeagueMember.create({ id: 'member-2', leagueId: 'league-1', userId: 'owner-1', role: 'admin' }),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result.role).toBe('member');
        expect(result.membersCount).toBe(2);
        expect(result.inviteCode).toBe('ABC123');
        expect(result.league).not.toHaveProperty('inviteCode');
    });
});
