import { UserRepository } from "../../domain/ports/user.repository";
import { User } from "../../domain/entities/user.entity"
import { LoginUserUseCase } from "./login-user.use-case";
import * as bcrypt from 'bcrypt';

const mockUserRepository: jest.Mocked<UserRepository> = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
}

const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-jwt-token')
} as any;

describe('LoginUserUseCase', () => {
    let useCase: LoginUserUseCase;

    beforeEach(() => {
        useCase = new LoginUserUseCase(mockUserRepository, mockJwtService);
        jest.clearAllMocks();
    });

    it('should return accessToken and user data on valid credentials', async () => {
        const hashedPassword = await bcrypt.hash('123456', 10);
        mockUserRepository.findByEmail.mockResolvedValue(
            User.create({id: '123', email: 'test@test.com', password: hashedPassword, name: 'otro'})
        );

        const result = await useCase.execute({
            email: 'test@test.com',
            password: '123456'
        });

        expect(result.accessToken).toBe('mocked-jwt-token');
        expect(result.user.email).toBe('test@test.com');
        expect(result.user.id).toBe('123');
        expect(result.user.name).toBe('otro');
        expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    it('should return Unauthorized if email does not exists', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(
            useCase.execute({ email: 'test@test.com', password: '123456' })
        ).rejects.toThrow('Invalid email')
    });

    it('should return Unauthorized if password does not exists', async () => {
        const hashedPassword = await bcrypt.hash('123456', 10);
        mockUserRepository.findByEmail.mockResolvedValue(
            User.create({id: '123', email: 'test@test.com', password: hashedPassword, name: 'otro'})
        );

        await expect(
            useCase.execute({ email: 'test@test.com', password: '123456789' })
        ).rejects.toThrow('Invalid password')
    });

});