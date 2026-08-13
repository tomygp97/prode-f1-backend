import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { SetLeaguePredictionSlotsUseCase } from './set-league-prediction-slots.use-case';

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

describe('SetLeaguePredictionSlotsUseCase', () => {
    let useCase: SetLeaguePredictionSlotsUseCase;

    const league = () => League.create({
        id: 'league-1', name: 'Liga Test', ownerId: 'admin-1',
        inviteCode: 'ABC123', isPublic: true, predictionSlots: 3, seasonId: 'season-1',
    });

    beforeEach(() => {
        useCase = new SetLeaguePredictionSlotsUseCase(mockLeagueRepository, mockMemberRepository);
        jest.clearAllMocks();
    });

    it('should update prediction slots when requester is admin', async () => {
        mockLeagueRepository.findById.mockResolvedValue(league());
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'admin-1', role: 'admin' })
        );
        mockLeagueRepository.save.mockResolvedValue();

        const result = await useCase.execute({ leagueId: 'league-1', requesterId: 'admin-1', predictionSlots: 10 });

        expect(result.predictionSlots).toBe(10);
        expect(mockLeagueRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw if league does not exist', async () => {
        mockLeagueRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'admin-1', predictionSlots: 10 })
        ).rejects.toThrow('League not found');
    });

    it('should throw if requester is not admin', async () => {
        mockLeagueRepository.findById.mockResolvedValue(league());
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-2', leagueId: 'league-1', userId: 'user-2', role: 'member' })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'user-2', predictionSlots: 10 })
        ).rejects.toThrow('Only the league admin can change prediction slots');

        expect(mockLeagueRepository.save).not.toHaveBeenCalled();
    });

    it('should throw if predictionSlots is out of range', async () => {
        mockLeagueRepository.findById.mockResolvedValue(league());
        mockMemberRepository.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'admin-1', role: 'admin' })
        );

        await expect(
            useCase.execute({ leagueId: 'league-1', requesterId: 'admin-1', predictionSlots: 30 })
        ).rejects.toThrow('Prediction slots must be between 3 and 22');
    });
});