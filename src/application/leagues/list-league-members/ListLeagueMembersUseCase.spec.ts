import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { ListLeagueMembersUseCase } from './list-league-members.use-case';
import { UserRepository } from '../../../domain/ports/user.repository';
import { User } from '../../../domain/entities/user.entity';

const mockMemberRepository: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
    findActiveLeaguesByUser: jest.fn(),
};

const mockUserRepository: jest.Mocked<UserRepository> = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
};

describe('ListLeagueMembersUseCase', () => {
    let useCase: ListLeagueMembersUseCase;

    beforeEach(() => {
        useCase = new ListLeagueMembersUseCase(mockMemberRepository, mockUserRepository);
        jest.clearAllMocks();
    });

    it('should return active members if requester is an active member', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member',
            })
        );
        mockMemberRepository.findActiveMembersByLeague.mockResolvedValue([
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member', joinedAt: new Date('2026-03-01') }),
            LeagueMember.create({ id: 'member-2', leagueId: 'league-1', userId: 'admin-1', role: 'admin', joinedAt: new Date('2026-01-01') }),
        ]);
        mockUserRepository.findByIds.mockResolvedValue([
            User.create({ id: 'user-1', email: 'u@test.com', password: 'x', name: 'Lucía' }),
            User.create({ id: 'admin-1', email: 'a@test.com', password: 'x', name: 'Tomás' }),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        // con nombre y ordenados por antigüedad
        expect(result.map((m) => [m.name, m.role])).toEqual([['Tomás', 'admin'], ['Lucía', 'member']]);
    });

    it('should throw if requester is not a member', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'stranger-1' })
        ).rejects.toThrow('You must be a member of this league to view its members');

        expect(mockMemberRepository.findActiveMembersByLeague).not.toHaveBeenCalled();
    });

    it('should throw if requester left the league before', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member',
                leftAt: new Date('2026-01-01'),
            })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' })
        ).rejects.toThrow('You must be a member of this league to view its members');

        expect(mockMemberRepository.findActiveMembersByLeague).not.toHaveBeenCalled();
    });
});