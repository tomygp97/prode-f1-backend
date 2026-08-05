import { RaceRepository } from "../../../domain/ports/race.repository";
import { Race } from "../../../domain/entities/race.entity";
import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { GetRaceByIdUseCase } from "./get-race-by-id.use-case";

const mockRaceRepository: jest.Mocked<RaceRepository> = {
    upsertFromMeeting: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findNext: jest.fn(),
    findScheduledBeforeDate: jest.fn(),
    findLockedRacesWithPastStartTime: jest.fn(),
    findRacesPendingResultsSync: jest.fn(),
    updateStatus: jest.fn(),
};

const fakeRace1 = Race.create({
    id: 'race-1',
    seasonId: 'season-1',
    name: 'Australian GP',
    circuit: 'Albert Park',
    country: 'Australia',
    round: 1,
    qualifyingStartAt: new Date('2026-03-07T05:00:00Z'),
    raceStartAt: new Date('2026-03-08T04:00:00Z'),
    status: RaceStatus.FINISHED,
    meetingKey: 1,
    raceSessionKey: 100,
    qualifyingSessionKey: 101,
});

const fakeRace2 = Race.create({
    id: 'race-2',
    seasonId: 'season-1',
    name: 'Chinese GP',
    circuit: 'Shanghai International Circuit',
    country: 'China',
    round: 2,
    qualifyingStartAt: new Date('2026-03-21T07:00:00Z'),
    raceStartAt: new Date('2026-03-22T07:00:00Z'),
    status: RaceStatus.FINISHED,
    meetingKey: 2,
    raceSessionKey: 200,
    qualifyingSessionKey: 201,
});

describe('GetRaceByIdUseCase', () => {
    let useCase: GetRaceByIdUseCase;

    beforeEach(() => {
        useCase = new GetRaceByIdUseCase(mockRaceRepository);
        jest.clearAllMocks();
    });

    it('should return race by id', async () => {
        mockRaceRepository.findById.mockResolvedValue(fakeRace1);
    
        const result = await useCase.execute('race-1');
    
        expect(mockRaceRepository.findById)
            .toHaveBeenCalledWith('race-1');
    
        expect(result).toEqual(fakeRace1);
    });

    it('should return null if race does not exist', async () => {
        mockRaceRepository.findById.mockResolvedValue(null);
    
        const result = await useCase.execute('invalid-id');
    
        expect(mockRaceRepository.findById)
            .toHaveBeenCalledWith('invalid-id');
    
        expect(result).toBeNull();
    });
})