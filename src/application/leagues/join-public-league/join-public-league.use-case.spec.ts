import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { JoinPublicLeagueUseCase } from './join-public-league.use-case';

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
};

describe('JoinPublicLeagueUseCase', () => {
    let useCase: JoinPublicLeagueUseCase;

    beforeEach(() => {
        useCase = new JoinPublicLeagueUseCase(mockLeagueRepository, mockMemberRepository);
        jest.clearAllMocks();
    });

    it('should join a public league without invite code', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: true, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);

        const result = await useCase.execute({ leagueId: 'league-1', userId: 'user-1' });

        expect(result.role).toBe('member');
        expect(mockMemberRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw if league does not exist', async () => {
        mockLeagueRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', userId: 'user-1' })
        ).rejects.toThrow('League not found');
    });

    it('should throw if league is private', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: false, seasonId: 'season-1',
            })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', userId: 'user-1' })
        ).rejects.toThrow('This league is private, you need an invite code to join');
    });

    it('should throw if user is already an active member', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: true, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member' })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', userId: 'user-1' })
        ).rejects.toThrow('User is already a member of this league');
    });

    it('should reactivate member if they left before', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: true, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'user-1',
                role: 'member', leftAt: new Date('2026-01-01'),
            })
        );

        const result = await useCase.execute({ leagueId: 'league-1', userId: 'user-1' });

        expect(result.id).toBe('member-1');
        expect(result.leftAt).toBeNull();
    });
});