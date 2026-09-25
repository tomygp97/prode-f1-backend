import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { InviteCodeGenerator } from '../../../domain/ports/invite-code-generator';
import { CreateLeagueUseCase } from './create-league.use-case';
import { DriverRepository } from '../../../domain/ports/driver.repository';
import { Driver } from '../../../domain/entities/driver.entity';

const mockLeagueRepository: jest.Mocked<LeagueRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPublicLeaguesWithMemberCount: jest.fn(),
    createWithOwner: jest.fn(),
    transferOwnership: jest.fn(),
    leaveAsAdmin: jest.fn(),
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

const mockDriverRepository: jest.Mocked<DriverRepository> = {
    upsert: jest.fn(),
    createIfMissing: jest.fn(),
    findByDriverNumbers: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
};

describe('CreateLeagueUseCase', () => {
    let useCase: CreateLeagueUseCase;

    beforeEach(() => {
        useCase = new CreateLeagueUseCase(mockLeagueRepository, mockMemberRepository, mockCodeGenerator, mockDriverRepository);
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

    describe('tracked driver (any driver of the season, one per league)', () => {
        const driverOfSeason = (seasonId: string) => Driver.create({
            id: 'driver-43', name: 'Franco Colapinto', acronym: 'COL', driverNumber: 43, seasonId, teamId: 'team-1',
        });

        beforeEach(() => {
            mockCodeGenerator.generate.mockReturnValue('COL043');
            mockLeagueRepository.createWithOwner.mockResolvedValue();
        });

        it('should accept a driver of the league season', async () => {
            mockDriverRepository.findById.mockResolvedValue(driverOfSeason('season-1'));

            const result = await useCase.execute({
                name: 'Liga Colapinto', ownerId: 'owner-1', isPublic: false, seasonId: 'season-1', trackedDriverId: 'driver-43',
            });

            expect(result.trackedDriverId).toBe('driver-43');
        });

        it('should reject a driver from another season', async () => {
            mockDriverRepository.findById.mockResolvedValue(driverOfSeason('season-2025'));

            await expect(useCase.execute({
                name: 'Liga', ownerId: 'owner-1', isPublic: false, seasonId: 'season-1', trackedDriverId: 'driver-43',
            })).rejects.toThrow('The tracked driver is not part of this season');
            expect(mockLeagueRepository.createWithOwner).not.toHaveBeenCalled();
        });

        it('should reject a driver that does not exist', async () => {
            mockDriverRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute({
                name: 'Liga', ownerId: 'owner-1', isPublic: false, seasonId: 'season-1', trackedDriverId: 'nope',
            })).rejects.toThrow('The tracked driver is not part of this season');
        });
    });
});