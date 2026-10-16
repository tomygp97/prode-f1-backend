import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRepository } from '../../../domain/ports/user.repository';
import { User } from '../../../domain/entities/user.entity';
import { AppRole } from '../../../domain/enums/app-role.enum';
import { AppAdminGuard } from './app-admin.guard';

const mockUserRepository: jest.Mocked<UserRepository> = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
};

const contextFor = (user?: { userId: string }) => ({
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
}) as unknown as ExecutionContext;

const user = (appRole: AppRole) => User.create({ id: 'u1', email: 'a@test.com', password: 'x', name: 'A', appRole });

describe('AppAdminGuard', () => {
    const guard = new AppAdminGuard(mockUserRepository);

    beforeEach(() => jest.clearAllMocks());

    it('should let app admins through', async () => {
        mockUserRepository.findById.mockResolvedValue(user(AppRole.ADMIN));

        await expect(guard.canActivate(contextFor({ userId: 'u1' }))).resolves.toBe(true);
    });

    it('should reject regular users with 403', async () => {
        mockUserRepository.findById.mockResolvedValue(user(AppRole.USER));

        await expect(guard.canActivate(contextFor({ userId: 'u1' }))).rejects.toThrow(ForbiddenException);
    });

    it('should reject when there is no user in the request or it no longer exists', async () => {
        mockUserRepository.findById.mockResolvedValue(null);

        await expect(guard.canActivate(contextFor())).rejects.toThrow(ForbiddenException);
        await expect(guard.canActivate(contextFor({ userId: 'gone' }))).rejects.toThrow(ForbiddenException);
    });
});
