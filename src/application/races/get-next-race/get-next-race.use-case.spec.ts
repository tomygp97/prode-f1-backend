import { RaceRepository } from "../../../domain/ports/race.repository";
import { Race } from "../../../domain/entities/race.entity";
import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { GetNextRaceUseCase } from "./get-next-race.use-case";
import { mockRaceRepository } from "../../../../test/mocks/race-repository.mock";

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

describe('GetNextRaceUseCase', () => {
    let useCase: GetNextRaceUseCase;

    beforeEach(() => {
        useCase = new GetNextRaceUseCase(mockRaceRepository);
        jest.clearAllMocks();
    });

    it('should return next race', async () => {
        mockRaceRepository.findNext.mockResolvedValue(fakeRace1);
    
        const result = await useCase.execute();
    
        expect(mockRaceRepository.findNext).toHaveBeenCalledTimes(1);
        expect(result).toEqual(fakeRace1);
    });

    it('should return null if there is no next race', async () => {
        mockRaceRepository.findNext.mockResolvedValue(null);
    
        const result = await useCase.execute();
    
        expect(mockRaceRepository.findNext).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });
})