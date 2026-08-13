import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeaguePrizeRepository } from '../../../domain/ports/league-prize.repository';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { LeaguePrize } from '../../../domain/entities/league-prize.entity';
import { GetLeaguePrizesUseCase } from './get-league-prizes.use-case';

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

const mockPrizeRepository: jest.Mocked<LeaguePrizeRepository> = {
    replaceAll: jest.fn(),
    findByLeagueId: jest.fn(),
};

describe('GetLeaguePrizesUseCase', () => {
    let useCase: GetLeaguePrizesUseCase;

    beforeEach(() => {
        useCase = new GetLeaguePrizesUseCase(mockLeagueRepository, mockMemberRepository, mockPrizeRepository);
        jest.clearAllMocks();
    });

    it('should return prizes for a public league without requiring membership', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: true, seasonId: 'season-1',
            })
        );
        mockPrizeRepository.findByLeagueId.mockResolvedValue([
            LeaguePrize.create({ id: 'prize-1', leagueId: 'league-1', position: 1, description: '$10000' }),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'stranger-1' });

        expect(result).toHaveLength(1);
        expect(mockMemberRepository.findByLeagueAndUser).not.toHaveBeenCalled(); // 👈 ni se chequea membresía
    });

    it('should throw if league does not exist', async () => {
        mockLeagueRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' })
        ).rejects.toThrow('League not found');
    });

    it('should throw if league is private and requester is not a member', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: false, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'stranger-1' })
        ).rejects.toThrow('You must be a member of this league to view its prizes');
    });

    it('should return prizes if league is private but requester is an active member', async () => {
        mockLeagueRepository.findById.mockResolvedValue(
            League.create({
                id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
                inviteCode: 'ABC123', isPublic: false, seasonId: 'season-1',
            })
        );
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member' })
        );
        mockPrizeRepository.findByLeagueId.mockResolvedValue([
            LeaguePrize.create({ id: 'prize-1', leagueId: 'league-1', position: 1, description: '$10000' }),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'user-1' });

        expect(result).toHaveLength(1);
    });
});