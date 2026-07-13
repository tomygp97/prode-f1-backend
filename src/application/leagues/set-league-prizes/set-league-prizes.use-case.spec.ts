import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { LeaguePrizeRepository } from '../../../domain/ports/league-prize.repository';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { SetLeaguePrizesUseCase } from './set-league-prizes.use-case';

const mockMemberRepository: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
};

const mockPrizeRepository: jest.Mocked<LeaguePrizeRepository> = {
    replaceAll: jest.fn(),
    findByLeagueId: jest.fn(),
};

describe('SetLeaguePrizesUseCase', () => {
    let useCase: SetLeaguePrizesUseCase;

    beforeEach(() => {
        useCase = new SetLeaguePrizesUseCase(mockMemberRepository, mockPrizeRepository);
        jest.clearAllMocks();
    });

    it('should replace prizes when requester is admin', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'admin-1', role: 'admin',
            })
        );
        mockPrizeRepository.replaceAll.mockResolvedValue();

        const result = await useCase.execute({
            leagueId: 'league-1',
            requesterId: 'admin-1',
            prizes: [
                { position: 1, description: '$10000' },
                { position: 2, description: '$5000' },
            ],
        });

        expect(result).toHaveLength(2);
        expect(result[0].position).toBe(1);
        expect(result[0].description).toBe('$10000');
        expect(mockPrizeRepository.replaceAll).toHaveBeenCalledTimes(1);
    });

    it('should throw if requester is not a member', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(null);

        await expect(
            useCase.execute({
                leagueId: 'league-1',
                requesterId: 'stranger-1',
                prizes: [{ position: 1, description: '$10000' }],
            })
        ).rejects.toThrow('Only the league admin can set prizes');

        expect(mockPrizeRepository.replaceAll).not.toHaveBeenCalled();
    });

    it('should throw if requester is a member but not admin', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member',
            })
        );

        await expect(
            useCase.execute({
                leagueId: 'league-1',
                requesterId: 'user-1',
                prizes: [{ position: 1, description: '$10000' }],
            })
        ).rejects.toThrow('Only the league admin can set prizes');

        expect(mockPrizeRepository.replaceAll).not.toHaveBeenCalled();
    });

    it('should throw if there are duplicate positions', async () => {
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({
                id: 'member-1', leagueId: 'league-1', userId: 'admin-1', role: 'admin',
            })
        );

        await expect(
            useCase.execute({
                leagueId: 'league-1',
                requesterId: 'admin-1',
                prizes: [
                    { position: 1, description: '$10000' },
                    { position: 1, description: '$5000' }, // 👈 posición repetida
                ],
            })
        ).rejects.toThrow('Duplicate prize positions are not allowed');

        expect(mockPrizeRepository.replaceAll).not.toHaveBeenCalled();
    });
});