import { GetDriversUseCase } from './get-drivers.use-case';
import { DriverRepository } from '../../../domain/ports/driver.repository';
import { Driver } from '../../../domain/entities/driver.entity';

const mockDriverRepository: jest.Mocked<DriverRepository> = {
  upsert: jest.fn(),
  findByDriverNumbers: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
};

const fakeDriver1 = Driver.create({
  id: 'driver-1',
  name: 'Max Verstappen',
  acronym: 'VER',
  driverNumber: 1,
  seasonId: 'season-1',
  teamId: 'team-1',
});

const fakeDriver2 = Driver.create({
  id: 'driver-2',
  name: 'Charles Leclerc',
  acronym: 'LEC',
  driverNumber: 16,
  seasonId: 'season-1',
  teamId: 'team-2',
});

describe('GetDriversUseCase', () => {
  let useCase: GetDriversUseCase;

  beforeEach(() => {
    useCase = new GetDriversUseCase(mockDriverRepository);
    jest.clearAllMocks();
  });

  it('should return all drivers', async () => {
    mockDriverRepository.findAll.mockResolvedValue([
      fakeDriver1,
      fakeDriver2,
    ]);

    const result = await useCase.execute();

    expect(mockDriverRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      fakeDriver1,
      fakeDriver2,
    ]);
  });
});