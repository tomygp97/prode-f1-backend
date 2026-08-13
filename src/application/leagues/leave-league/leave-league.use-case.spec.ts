import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeaveLeagueUseCase } from './leave-league.use-case';

const mockMemberRepository: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
    findActiveLeaguesByUser: jest.fn(),
};

describe('LeaveLeagueUseCase', () => {
    let useCase: LeaveLeagueUseCase;

    beforeEach(() => {
        useCase = new LeaveLeagueUseCase(mockMemberRepository);
        jest.clearAllMocks();
    });

    it('should mark member as left when a regular member leaves', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1',
                leagueId: 'league-1',
                userId: 'user-1',
                role: 'member',
            })
        );
        mockMemberRepository.save.mockResolvedValue();

        await useCase.execute({ leagueId: 'league-1', userId: 'user-1' });

        expect(mockMemberRepository.save).toHaveBeenCalledTimes(1);
        const [savedMember] = mockMemberRepository.save.mock.calls[0];
        expect(savedMember.leftAt).not.toBeNull();
        expect(savedMember.id).toBe('member-1'); // mismo registro, no uno nuevo
    });

    it('should throw if user is not an active member', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', userId: 'user-1' })
        ).rejects.toThrow('You are not an active member of this league');

        expect(mockMemberRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if user already left before', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1',
                leagueId: 'league-1',
                userId: 'user-1',
                role: 'member',
                leftAt: new Date('2026-01-01'), // ya se había ido
            })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', userId: 'user-1' })
        ).rejects.toThrow('You are not an active member of this league');

        expect(mockMemberRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if the admin tries to leave', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1',
                leagueId: 'league-1',
                userId: 'owner-1',
                role: 'admin',
            })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', userId: 'owner-1' })
        ).rejects.toThrow('League admin cannot leave. Transfer ownership first.');

        expect(mockMemberRepository.save).not.toHaveBeenCalled();
    });
});