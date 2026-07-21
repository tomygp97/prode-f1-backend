import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { TransferLeagueOwnershipUseCase } from './transfer-league-ownership.use-case';

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

describe('TransferLeagueOwnershipUseCase', () => {
    let useCase: TransferLeagueOwnershipUseCase;

    beforeEach(() => {
        useCase = new TransferLeagueOwnershipUseCase(mockLeagueRepository, mockMemberRepository);
        jest.clearAllMocks();
    });

    const league = () => League.create({
        id: 'league-1', name: 'Liga Test', ownerId: 'admin-1',
        inviteCode: 'ABC123', isPublic: true, seasonId: 'season-1',
    });

    it('should transfer ownership successfully', async () => {
        mockLeagueRepository.findById.mockResolvedValue(league());
        mockMemberRepository.findByLeagueAndUser.mockImplementation(async (_leagueId, userId) => {
            if (userId === 'admin-1') {
                return LeagueMember.create({ id: 'member-admin', leagueId: 'league-1', userId: 'admin-1', role: 'admin' });
            }
            if (userId === 'user-2') {
                return LeagueMember.create({ id: 'member-2', leagueId: 'league-1', userId: 'user-2', role: 'member' });
            }
            return null;
        });
        mockLeagueRepository.transferOwnership.mockResolvedValue();

        await useCase.execute({ leagueId: 'league-1', requesterId: 'admin-1', newOwnerId: 'user-2' });

        expect(mockLeagueRepository.transferOwnership).toHaveBeenCalledTimes(1);
        const [updatedLeague, demotedAdmin, promotedOwner] = mockLeagueRepository.transferOwnership.mock.calls[0];
        expect(updatedLeague.ownerId).toBe('user-2');
        expect(demotedAdmin.role).toBe('member');
        expect(promotedOwner.role).toBe('admin');
    });

    it('should throw if requester tries to transfer to themselves', async () => {
        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'admin-1', newOwnerId: 'admin-1' })
        ).rejects.toThrow('You are already the owner of this league');

        expect(mockLeagueRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw if league does not exist', async () => {
        mockLeagueRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'admin-1', newOwnerId: 'user-2' })
        ).rejects.toThrow('League not found');
    });

    it('should throw if requester is not the current admin', async () => {
        mockLeagueRepository.findById.mockResolvedValue(league());
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-x', leagueId: 'league-1', userId: 'user-x', role: 'member' })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'user-x', newOwnerId: 'user-2' })
        ).rejects.toThrow('Only the current league admin can transfer ownership');

        expect(mockLeagueRepository.transferOwnership).not.toHaveBeenCalled();
    });

    it('should throw if new owner is not an active member of the league', async () => {
        mockLeagueRepository.findById.mockResolvedValue(league());
        mockMemberRepository.findByLeagueAndUser.mockImplementation(async (_leagueId, userId) => {
            if (userId === 'admin-1') {
                return LeagueMember.create({ id: 'member-admin', leagueId: 'league-1', userId: 'admin-1', role: 'admin' });
            }
            return null; // el nuevo dueño no es miembro
        });

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'admin-1', newOwnerId: 'user-2' })
        ).rejects.toThrow('New owner must be an active member of this league');

        expect(mockLeagueRepository.transferOwnership).not.toHaveBeenCalled();
    });
});