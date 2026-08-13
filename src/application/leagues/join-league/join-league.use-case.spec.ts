import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { JoinLeagueUseCase } from './join-league.use-case';

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

describe('JoinLeagueUseCase', () => {
    let useCase: JoinLeagueUseCase;

    beforeEach(() => {
        useCase = new JoinLeagueUseCase(mockLeagueRepository, mockMemberRepository);
        jest.clearAllMocks();
    });

    it('should create a new member if user never joined before', async () => {
        mockLeagueRepository.findByInviteCode.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: false, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);

        const result = await useCase.execute({ inviteCode: 'ABC123', userId: 'user-1' });

        expect(result.role).toBe('member');
        expect(result.leftAt).toBeNull();
        expect(mockMemberRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw if invite code does not exist', async () => {
        mockLeagueRepository.findByInviteCode.mockResolvedValue(null);

        await expect(
            useCase.execute({ inviteCode: 'INVALID', userId: 'user-1' })
        ).rejects.toThrow('Invalid invite code');
    });

    it('should throw if user is already an active member', async () => {
        mockLeagueRepository.findByInviteCode.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: false, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member',
            })
        );

        await expect(
            useCase.execute({ inviteCode: 'ABC123', userId: 'user-1' })
        ).rejects.toThrow('User is already a member of this league');
    });

    it('should reactivate member if they left before', async () => {
        mockLeagueRepository.findByInviteCode.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: false, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'user-1',
                role: 'member', leftAt: new Date('2026-01-01'),
            })
        );

        const result = await useCase.execute({ inviteCode: 'ABC123', userId: 'user-1' });

        expect(result.id).toBe('member-1'); // mismo id, se reactivó
        expect(result.leftAt).toBeNull();
    });
});