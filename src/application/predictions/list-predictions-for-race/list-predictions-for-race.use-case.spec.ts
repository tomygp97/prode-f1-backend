import { PredictionRepository } from '../../../domain/ports/prediction.repository';
import { LeagueMemberRepository } from '../../../domain/ports/league-member.repository';
import { RaceRepository } from '../../../domain/ports/race.repository';
import { LeagueMember } from '../../../domain/entities/league-member.entity';
import { Race } from '../../../domain/entities/race.entity';
import { Prediction } from '../../../domain/entities/prediction.entity';
import { RaceStatus } from '../../../domain/enums/race-status.enum';
import { ListPredictionsForRaceUseCase } from './list-predictions-for-race.use-case';

const mockPredictionRepo: jest.Mocked<PredictionRepository> = {
    save: jest.fn(),
    findByLeagueRaceAndUser: jest.fn(),
    findAllByLeagueAndRace: jest.fn(),
    findAllByRaceId: jest.fn(),
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
    findByStatus: jest.fn(),
    findRacesPendingResultsSync: jest.fn(),
    findNext: jest.fn(),
    findScheduledBeforeDate: jest.fn(),
    findLockedRacesWithPastStartTime: jest.fn(),
    updateStatus: jest.fn(),
};

describe('ListPredictionsForRaceUseCase', () => {
    let useCase: ListPredictionsForRaceUseCase;

    const race = (status: RaceStatus) => Race.create({
        id: 'race-1', seasonId: 'season-1', name: 'GP Test', circuit: 'Circuit', country: 'Country',
        round: 1, qualifyingStartAt: null, raceStartAt: null,
        status, meetingKey: 1, raceSessionKey: null, qualifyingSessionKey: null,
    });

    beforeEach(() => {
        useCase = new ListPredictionsForRaceUseCase(mockPredictionRepo, mockMemberRepo, mockRaceRepo);
        jest.clearAllMocks();
    });

    it('should return predictions when race is finished and requester is an active member', async () => {
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member' })
        );
        mockRaceRepo.findById.mockResolvedValue(race(RaceStatus.FINISHED));
        mockPredictionRepo.findAllByLeagueAndRace.mockResolvedValue([
            Prediction.create({ id: 'p1', userId: 'user-1', leagueId: 'league-1', raceId: 'race-1', predictedOrder: ['d1', 'd2', 'd3'], safetyCar: true, dnfCount: 0 }),
        ]);

        const result = await useCase.execute({ leagueId: 'league-1', raceId: 'race-1', requesterId: 'user-1' });

        expect(result).toHaveLength(1);
    });

    it('should throw if requester is not an active member', async () => {
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', requesterId: 'stranger-1' })
        ).rejects.toThrow('You must be an active member of this league to view predictions');

        expect(mockRaceRepo.findById).not.toHaveBeenCalled();
    });

    it('should throw if race does not exist', async () => {
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member' })
        );
        mockRaceRepo.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', requesterId: 'user-1' })
        ).rejects.toThrow('Race not found');
    });

    it('should throw if race is still SCHEDULED', async () => {
        mockMemberRepo.findByLeagueAndUser.mockResolvedValue(
            LeagueMember.create({ id: 'member-1', leagueId: 'league-1', userId: 'user-1', role: 'member' })
        );
        mockRaceRepo.findById.mockResolvedValue(race(RaceStatus.SCHEDULED));

        await expect(
            useCase.execute({ leagueId: 'league-1', raceId: 'race-1', requesterId: 'user-1' })
        ).rejects.toThrow('Predictions for this race are not visible yet');

        expect(mockPredictionRepo.findAllByLeagueAndRace).not.toHaveBeenCalled();
    });
});