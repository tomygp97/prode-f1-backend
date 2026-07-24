import { DriverRepository } from "../../domain/ports/driver.repository";
import { OfficialResultsProvider } from "../../domain/ports/official-results.provider";
import { TeamRepository } from "../../domain/ports/team.repository";
import { SyncDriversUseCase } from "./sync-drivers.use-case";

const mockOfficialResultsProvider: jest.Mocked<OfficialResultsProvider> = {
    getMeetings: jest.fn(),
    getDriverPositions: jest.fn(),
    getDrivers: jest.fn(),
    hasRaceResults: jest.fn(),
    hasSafetyCar: jest.fn(),
}
const mockTeamRepository: jest.Mocked<TeamRepository> = {
    upsert: jest.fn(),
    findByName: jest.fn(),
}
const mockDriverRepository = {
    upsert: jest.fn(),
    findByDriverNumber: jest.fn(),
}

describe('SyncDriversUseCase', () => {
    let useCase: SyncDriversUseCase;

    beforeEach(() => {
        useCase = new SyncDriversUseCase(mockOfficialResultsProvider, mockTeamRepository, mockDriverRepository);
        jest.clearAllMocks();
    });

    it('should sync teams and drivers', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([
            {
                driverNumber: 4,
                fullName: 'Lando Norris',
                acronym: 'NOR',
                teamName: 'McLaren',
                teamColour: 'F47600',
              },
              {
                driverNumber: 1,
                fullName: 'Max Verstappen',
                acronym: 'VER',
                teamName: 'Red Bull Racing',
                teamColour: '3671C6',
              },
        ]);

        mockTeamRepository.upsert.mockResolvedValueOnce('team-id-1')
        mockTeamRepository.upsert.mockResolvedValueOnce('team-id-2')
        mockDriverRepository.upsert.mockResolvedValue('driver-id-1')

        await useCase.execute(11328, 'season-1')

        expect(mockOfficialResultsProvider.getDrivers).toHaveBeenCalledWith(11328);
        expect(mockTeamRepository.upsert).toHaveBeenCalledTimes(2);
        expect(mockDriverRepository.upsert).toHaveBeenCalledTimes(2);

        expect(mockTeamRepository.upsert).toHaveBeenNthCalledWith(1,
            {
            name: 'McLaren',
            colour: 'F47600',
            seasonId: 'season-1',
        });
        expect(mockTeamRepository.upsert).toHaveBeenNthCalledWith(2,
            {
            name: 'Red Bull Racing',
            colour: '3671C6',
            seasonId: 'season-1',
        });

        expect(mockDriverRepository.upsert).toHaveBeenCalledWith(
            {
                driverNumber: 4,
                name: 'Lando Norris',
                acronym: 'NOR',
                teamId: 'team-id-1',
                seasonId: 'season-1',
            }
        );
        expect(mockDriverRepository.upsert).toHaveBeenCalledWith(
            {
                driverNumber: 1,
                name: 'Max Verstappen',
                acronym: 'VER',
                teamId: 'team-id-2',
                seasonId: 'season-1',
            },
        );
    });

    it('should not sync anything when no drivers are returned', async () => {
        mockOfficialResultsProvider.getDrivers.mockResolvedValue([]);

        await useCase.execute(11328, 'season-1');

        expect(mockOfficialResultsProvider.getDrivers).toHaveBeenCalledWith(11328);
        expect(mockTeamRepository.upsert).not.toHaveBeenCalled();
        expect(mockDriverRepository.upsert).not.toHaveBeenCalled();
    });

    it('should throw if OpenF1 fails', async () => {
        mockOfficialResultsProvider.getDrivers.mockRejectedValue(
            new Error('OpenF1 unavailable'),
        );

        await expect(
            useCase.execute(11328, 'season-1'),
        ).rejects.toThrow('OpenF1 unavailable');

        expect(mockTeamRepository.upsert).not.toHaveBeenCalled();
        expect(mockDriverRepository.upsert).not.toHaveBeenCalled();
    });
});