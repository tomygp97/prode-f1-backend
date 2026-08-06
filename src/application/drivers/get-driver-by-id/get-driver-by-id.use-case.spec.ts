import { Driver } from "../../../domain/entities/driver.entity";
import { DriverRepository } from "../../../domain/ports/driver.repository";
import { GetDriverById } from "./get-driver-by-id.use-case";

const mockDriverRepository: jest.Mocked<DriverRepository> = {
    upsert: jest.fn(),
    findByDriverNumbers: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
};

const fakeDriver = Driver.create({
    id: 'driver-1',
    name: 'Max Verstappen',
    acronym: 'VER',
    driverNumber: 1,
    seasonId: 'season-1',
    teamId: 'team-1',
});
  
describe('GetDriverById', () => {
let useCase: GetDriverById;

beforeEach(() => {
    useCase = new GetDriverById(mockDriverRepository);
    jest.clearAllMocks();
});

it('should return a driver', async () => {
    mockDriverRepository.findById.mockResolvedValue(fakeDriver);

    const result = await useCase.execute('driver-1');

    expect(mockDriverRepository.findById).toHaveBeenCalledWith('driver-1');
    expect(result).toEqual(fakeDriver);
});

it('should return null when driver does not exist', async () => {
    mockDriverRepository.findById.mockResolvedValue(null);

    const result = await useCase.execute('driver-999');

    expect(mockDriverRepository.findById).toHaveBeenCalledWith('driver-999');
    expect(result).toBeNull();
});
});