import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { LeagueRepository } from '../../../domain/ports/league.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { League } from '../../../domain/entities/league.entity';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { Race } from '../../../domain/entities/race.entity';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { RaceStatus } from '../../../domain/enums/race-status.enum';
import { SubmitPredictionUseCase } from './submit-prediction.use-case';

const mockPredictionRepo: jest.Mocked<PredictionRepository> = {
    save: jest.fn(),
    findByLeagueRaceAndUser: jest.fn(),
    findAllByLeagueAndRace: jest.fn(),
    findAllByRaceId: jest.fn(),
};

const mockLeagueRepo: jest.Mocked<LeagueRepository> = {
    save: jest.fn(),
    findById: jest.fn(),
    findByInviteCode: jest.fn(),
    findPublicLeaguesWithMemberCount: jest.fn(),
    createWithOwner: jest.fn(),
    transferOwnership: jest.fn(),
};

const mockMemberRepo: jest.Mocked<LeagueMemberRepository> = {
    save: jest.fn(),
    findByLeagueAndUser: jest.fn(),
    findActiveMembersByLeague: jest.fn(),
};

const mockRaceRepo: jest.Mocked<RaceRepository> = {
    upsertFromMeeting: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByStatus: jest.fn(), // 👈 agregar
    findRacesPendingResultsSync: jest.fn(),
    findNext: jest.fn(),
    findScheduledBeforeDate: jest.fn(),
    findLockedRacesWithPastStartTime: jest.fn(),
    updateStatus: jest.fn(),
};
describe('SubmitPredictionUseCase', () => {
    let useCase: SubmitPredictionUseCase;

    const league = (predictionSlots = 3, trackedDriverId: string | null = null) => League.create({
        id: 'league-1', name: 'Liga Test', ownerId: 'owner-1',
        inviteCode: 'ABC123', isPublic: true, predictionSlots, seasonId: 'season-1', trackedDriverId,
    });

    const scheduledRace = () => Race.create({
        id: 'race-1', seasonId: 'season-1', name: 'GP Test', circuit: 'Circuit', country: 'Country',
        round: 1, qualifyingStartAt: new Date('2026-08-01'), raceStartAt: new Date('2026-08-02'),
        status: RaceStatus.SCHEDULED, meetingKey: 1, raceSessionKey: null, qualifyingSessionKey: null,
    });

    const activeMember = () => LeagueMember.create({
        id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member',
    });

    beforeEach(() => {
        useCase = new SubmitPredictionUseCase(mockPredictionRepo, mockLeagueRepo, mockMemberRepo, mockRaceRepo);
        jest.clearAllMocks();
    });

    it('should create a new prediction when everything is valid', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(3));
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(activeMember());
        mockRaceRepo.findById.mockResolvedValue(scheduledRace());
        mockPredictionRepo.findByLeagueRaceAndUser.mockResolvedValue(null);
        mockPredictionRepo.save.mockResolvedValue();

        const result = await useCase.execute({
            leagueId: 'league-1', raceId: 'race-1', userId: 'user-1',
            predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 2,
        });

        expect(result.predictedOrder).toEqual(['d1', 'd2', 'd3']);
        expect(mockPredictionRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should update (same id) when a prediction already exists', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(3));
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(activeMember());
        mockRaceRepo.findById.mockResolvedValue(scheduledRace());
        mockPredictionRepo.findByLeagueRaceAndUser.mockResolvedValue(
            Prediction.create({
                id: 'prediction-1', userId: 'user-1', leagueId: 'league-1', raceId: 'race-1',
                predictedOrder: ['old1', 'old2', 'old3'], safetyCar: false, dnfCount: 0,
            })
        );

        const result = await useCase.execute({
            leagueId: 'league-1', raceId: 'race-1', userId: 'user-1',
            predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 2,
        });

        expect(result.id).toBe('prediction-1'); // mismo id, no crea uno nuevo
    });

    it('should throw if league does not exist', async () => {
        mockLeagueRepo.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1', predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 0 })
        ).rejects.toThrow('League not found');
    });

    it('should throw if requester is not an active member', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(3));
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1', predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 0 })
        ).rejects.toThrow('You must be an active member of this league to submit a prediction');
    });

    it('should throw if race does not exist', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(3));
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(activeMember());
        mockRaceRepo.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1', predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 0 })
        ).rejects.toThrow('Race not found');
    });

    it('should throw if race is not SCHEDULED', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(3));
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(activeMember());
        mockRaceRepo.findById.mockResolvedValue(Race.create({
            id: 'race-1', seasonId: 'season-1', name: 'GP Test', circuit: 'Circuit', country: 'Country',
            round: 1, qualifyingStartAt: null, raceStartAt: null,
            status: RaceStatus.FINISHED, meetingKey: 1, raceSessionKey: null, qualifyingSessionKey: null,
        }));

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1', predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 0 })
        ).rejects.toThrow('Predictions are closed for this race');
    });

    it('should throw if predictedOrder length does not match league predictionSlots', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(10)); // liga pide 10
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(activeMember());
        mockRaceRepo.findById.mockResolvedValue(scheduledRace());

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1', predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 0 })
        ).rejects.toThrow('This league requires exactly 10 predicted positions');
    });

    it('should throw if league tracks a driver but trackedDriverPosition is missing', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(3, 'driver-tracked-1'));
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(activeMember());
        mockRaceRepo.findById.mockResolvedValue(scheduledRace());

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1', predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 0 })
        ).rejects.toThrow('This league requires a tracked driver position prediction');
    });

    it('should throw if league does not track a driver but trackedDriverPosition is provided', async () => {
        mockLeagueRepo.findById.mockResolvedValue(league(3, null));
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(activeMember());
        mockRaceRepo.findById.mockResolvedValue(scheduledRace());

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', userId: 'user-1', predictedOrder: ['d1', 'd2', 'd3'], trackedDriverPosition: 5, safetyCar: true, dnfCount: 0 })
        ).rejects.toThrow('This league does not track a driver, tracked driver position must not be provided');
    });
});