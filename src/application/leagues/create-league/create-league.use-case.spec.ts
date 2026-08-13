import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { InviteCodeGenerator } from '../../../domain/ports/invite-code-generator';
import { CreateLeagueUseCase } from './create-league.use-case';

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

const mockCodeGenerator: jest.Mocked<InviteCodeGenerator> = {
    generate: jest.fn(),
};

describe('CreateLeagueUseCase', () => {
    let useCase: CreateLeagueUseCase;

    beforeEach(() => {
        useCase = new CreateLeagueUseCase(mockLeagueRepository, mockMemberRepository, mockCodeGenerator);
        jest.clearAllMocks();
    });

    it('should create a league with the owner as admin member', async () => {
        mockCodeGenerator.generate.mockReturnValue('ABC123');
        mockLeagueRepository.createWithOwner.mockResolvedValue();

        const result = await useCase.execute({
            name: 'Liga Test',
            ownerId: 'owner-1',
            isPublic: true,
            seasonId: 'season-1',
        });

        expect(result.name).toBe('Liga Test');
        expect(result.ownerId).toBe('owner-1');
        expect(result.inviteCode).toBe('ABC123');
        expect(result.isPublic).toBe(true);
        expect(mockLeagueRepository.createWithOwner).toHaveBeenCalledTimes(1);
    });

    it('should create the owner member with admin role', async () => {
        mockCodeGenerator.generate.mockReturnValue('XYZ789');
        mockLeagueRepository.createWithOwner.mockResolvedValue();

        await useCase.execute({
            name: 'Liga Test 2',
            ownerId: 'owner-2',
            isPublic: false,
            seasonId: 'season-1',
        });

        const [, ownerMemberArg] = mockLeagueRepository.createWithOwner.mock.calls[0];
        expect(ownerMemberArg.role).toBe('admin');
        expect(ownerMemberArg.userId).toBe('owner-2');
        expect(ownerMemberArg.leftAt).toBeNull();
    });

    it('should set trackedDriverId to null when not provided', async () => {
        mockCodeGenerator.generate.mockReturnValue('DEF456');
        mockLeagueRepository.createWithOwner.mockResolvedValue();

        const result = await useCase.execute({
            name: 'Liga Test 3',
            ownerId: 'owner-3',
            isPublic: true,
            seasonId: 'season-1',
        });

        expect(result.trackedDriverId).toBeNull();
    });
});