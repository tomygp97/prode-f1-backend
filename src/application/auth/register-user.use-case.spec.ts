import { UserRepository } from "../../domain/ports/user.repository";
import { User } from "../../domain/entities/user.entity"
import { RegisterUserUseCase } from "./register-user.use-case";

const mockUserRepository: jest.Mocked<UserRepository> = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
}

describe('RegisterUserUseCase', () => {
    let useCase: RegisterUserUseCase;

    beforeEach(() => {
        useCase = new RegisterUserUseCase(mockUserRepository);
        jest.clearAllMocks();
    });

    it('should register a new user and return id, email and name', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.save.mockResolvedValue();

        const result = await useCase.execute({
            email: 'test@example.com',
            password: 'password',
            name: 'Test User',
        });

        expect(result.email).toBe('test@example.com');
        expect(result.name).toBe('Test User');
        expect(result.id).toBeDefined();
        expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should hash password before save', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.save.mockResolvedValue();

        await useCase.execute({
            email: 'test@test.com',
            password: '123456',
            name: 'Test'
        });

        const savedUser: User = mockUserRepository.save.mock.calls[0][0];
        expect(savedUser.password).not.toBe('123456');
        expect(savedUser.password).toMatch(/^\$2b\$/);
    });

    it('should send error if email is already registered', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(
            User.create({id: '123', email: 'test@test.com', password: 'hashed', name: 'otro'})
        );

        await expect(
            useCase.execute({ email: 'test@test.com', password: '123456', name: 'Tomas' })
        ).rejects.toThrow('Email already registered');

        expect(mockUserRepository.save).not.toHaveBeenCalled();
    });


});