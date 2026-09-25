import { NotFoundException } from "@nestjs/common";
import { RaceEntryRepository } from "../../../domain/ports/race-entry.repository";
import { RaceRepository } from "../../../domain/ports/race.repository";
import { Race } from "../../../domain/entities/race.entity";
import { RaceStatus } from "../../../domain/enums/race-status.enum";
import { RaceGridEntryView } from "../../../domain/views/race-grid.view";
import { GetRaceEntriesUseCase } from "./get-race-entries.use-case";

const mockRaceRepository = { findById: jest.fn() } as unknown as jest.Mocked<RaceRepository>;
const mockRaceEntryRepository: jest.Mocked<RaceEntryRepository> = {
    replaceForRace: jest.fn(),
    findByRaceId: jest.fn(),
    findGridByRaceId: jest.fn(),
    findLatestGrid: jest.fn(),
};

const fakeRace = Race.create({
    id: 'race-1', seasonId: 'season-1', name: 'Bahrain GP', circuit: 'Sakhir', country: 'Bahrain',
    round: 18, qualifyingStartAt: null, raceStartAt: null, status: RaceStatus.SCHEDULED,
    meetingKey: 1308, raceSessionKey: null, qualifyingSessionKey: null,
});

const gridEntry = (driverId: string): RaceGridEntryView => ({
    driverId, driverNumber: 1, name: driverId, acronym: driverId,
    team: { id: 'team-1', name: 'Team', colour: 'FFFFFF' },
});

describe('GetRaceEntriesUseCase', () => {
    let useCase: GetRaceEntriesUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetRaceEntriesUseCase(mockRaceRepository, mockRaceEntryRepository);
        mockRaceRepository.findById.mockResolvedValue(fakeRace);
    });

    it('should return the grid of the race', async () => {
        mockRaceEntryRepository.findGridByRaceId.mockResolvedValue([gridEntry('d1')]);

        const result = await useCase.execute('race-1');

        expect(result).toEqual([gridEntry('d1')]);
        expect(mockRaceEntryRepository.findLatestGrid).not.toHaveBeenCalled();
    });

    it('should fall back to the latest known grid when the race has none yet', async () => {
        mockRaceEntryRepository.findGridByRaceId.mockResolvedValue([]);
        mockRaceEntryRepository.findLatestGrid.mockResolvedValue([gridEntry('d2')]);

        const result = await useCase.execute('race-1');

        expect(mockRaceEntryRepository.findLatestGrid).toHaveBeenCalledWith('season-1');
        expect(result).toEqual([gridEntry('d2')]);
    });

    it('should throw NotFoundException if the race does not exist', async () => {
        mockRaceRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute('nope')).rejects.toThrow(NotFoundException);
    });
});
