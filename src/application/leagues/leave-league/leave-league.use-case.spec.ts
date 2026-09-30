import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeaveLeagueUseCase } from './leave-league.use-case';

const mockMemberRepository: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
    findActiveLeaguesByUser: jest.fn(),
};

const mockLeagueRepository: jest.Mocked<LeagueRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPublicLeaguesWithMemberCount: jest.fn(),
    createWithOwner: jest.fn(),
    transferOwnership: jest.fn(),
    leaveAsAdmin: jest.fn(),
};

describe('LeaveLeagueUseCase', () => {
    let useCase: LeaveLeagueUseCase;

    beforeEach(() => {
        useCase = new LeaveLeagueUseCase(mockMemberRepository, mockLeagueRepository);
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

    describe('when the admin leaves', () => {
        const admin = LeagueMember.create({
            id: 'member-admin', leagueId: 'league-1', userId: 'owner-1', role: 'admin',
            joinedAt: new Date('2026-01-01'),
        });
        const member = (userId: string, joinedAt: string) => LeagueMember.create({
            id: `member-${userId}`, leagueId: 'league-1', userId, role: 'member', joinedAt: new Date(joinedAt),
        });

        beforeEach(() => {
            mockMemberRepository.findByLeagueAndUser.mockResolvedValue(admin);
        });

        it('should hand the league over to the oldest active member', async () => {
            mockMemberRepository.findActiveMembersByLeague.mockResolvedValue([
                admin,
                member('newer', '2026-05-01'),
                member('oldest', '2026-02-01'),
            ]);

            const result = await useCase.execute({ leagueId: 'league-1', userId: 'owner-1' });

            expect(result).toEqual({ newAdminUserId: 'oldest', leagueDeleted: false });
            const [departing, successor] = mockLeagueRepository.leaveAsAdmin.mock.calls[0];
            expect(successor).toMatchObject({ userId: 'oldest', role: 'admin' });
            expect(departing.leftAt).not.toBeNull();
            expect(mockMemberRepository.save).not.toHaveBeenCalled(); // todo va en la transacción
        });

        it('should leave as a regular member, so rejoining does not bring the admin role back', async () => {
            mockMemberRepository.findActiveMembersByLeague.mockResolvedValue([admin, member('other', '2026-02-01')]);

            await useCase.execute({ leagueId: 'league-1', userId: 'owner-1' });

            const [departing] = mockLeagueRepository.leaveAsAdmin.mock.calls[0];
            expect(departing).toMatchObject({ id: 'member-admin', role: 'member' });
        });

        it('should delete the league when the admin is the only member', async () => {
            mockMemberRepository.findActiveMembersByLeague.mockResolvedValue([admin]);

            const result = await useCase.execute({ leagueId: 'league-1', userId: 'owner-1' });

            expect(result).toEqual({ newAdminUserId: null, leagueDeleted: true });
            expect(mockLeagueRepository.leaveAsAdmin.mock.calls[0][1]).toBeNull();
        });
    });
});