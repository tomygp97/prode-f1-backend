import { UserRepository } from "../../domain/ports/user.repository";
import { PasswordResetTokenRepository } from "../../domain/ports/password-reset-token.repository";
import { User } from "../../domain/entities/user.entity";
import { PasswordResetToken } from "../../domain/entities/password-reset-token.entity";
import { AppRole } from "../../domain/enums/app-role.enum";
import { CreatePasswordResetLinkUseCase } from "./create-password-reset-link.use-case";
import { ResetPasswordUseCase } from "./reset-password.use-case";
import { ChangePasswordUseCase } from "./change-password.use-case";
import { GetMeUseCase } from "./get-me.use-case";
import { hashPassword, verifyPassword } from "./password-hasher";
import { hashResetToken } from "./reset-token";

const mockUserRepository: jest.Mocked<UserRepository> = {
    save: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
};

const mockTokenRepository: jest.Mocked<PasswordResetTokenRepository> = {
    create: jest.fn(),
    findByTokenHash: jest.fn(),
    invalidateUnusedForUser: jest.fn(),
    consume: jest.fn(),
};

const NOW = new Date('2026-10-16T12:00:00Z');
const juan = (password = 'hash-vieja') => User.create({ id: 'user-juan', email: 'juan@test.com', password, name: 'Juan' });

beforeEach(() => jest.clearAllMocks());

describe('CreatePasswordResetLinkUseCase', () => {
    const useCase = new CreatePasswordResetLinkUseCase(mockUserRepository, mockTokenRepository);

    it('should create a 24 h one-use link storing only the token hash', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(juan());

        const link = await useCase.execute({ adminUserId: 'user-admin', email: ' Juan@Test.com ' }, NOW, 'https://prode.app/');

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('juan@test.com');
        expect(link.userName).toBe('Juan');
        expect(link.expiresAt).toEqual(new Date('2026-10-17T12:00:00Z'));

        const token = new URL(link.url).searchParams.get('token')!;
        expect(link.url.startsWith('https://prode.app/reset-password?token=')).toBe(true);

        const [saved] = mockTokenRepository.create.mock.calls[0];
        expect(saved.tokenHash).toBe(hashResetToken(token));
        expect(saved.tokenHash).not.toBe(token);
        expect(saved).toMatchObject({ userId: 'user-juan', createdById: 'user-admin', usedAt: null });
    });

    it('should invalidate the previous unused links of that user', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(juan());

        await useCase.execute({ adminUserId: 'user-admin', email: 'juan@test.com' }, NOW);

        expect(mockTokenRepository.invalidateUnusedForUser).toHaveBeenCalledWith('user-juan', NOW);
    });

    it('should return 404 for an unknown email', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        await expect(useCase.execute({ adminUserId: 'user-admin', email: 'nadie@test.com' }, NOW)).rejects.toThrow('User not found');
        expect(mockTokenRepository.create).not.toHaveBeenCalled();
    });
});

describe('ResetPasswordUseCase', () => {
    const useCase = new ResetPasswordUseCase(mockTokenRepository);
    const storedToken = (overrides: Partial<{ usedAt: Date | null; expiresAt: Date }> = {}) => PasswordResetToken.create({
        id: 'token-1', userId: 'user-juan', tokenHash: hashResetToken('secret'), createdById: 'user-admin',
        expiresAt: overrides.expiresAt ?? new Date('2026-10-17T00:00:00Z'), usedAt: overrides.usedAt ?? null,
    });

    it('should save the new password hash and consume the link', async () => {
        mockTokenRepository.findByTokenHash.mockResolvedValue(storedToken());

        await useCase.execute({ token: 'secret', newPassword: 'nueva123' }, NOW);

        expect(mockTokenRepository.findByTokenHash).toHaveBeenCalledWith(hashResetToken('secret'));
        const [tokenId, userId, passwordHash, at] = mockTokenRepository.consume.mock.calls[0];
        expect([tokenId, userId, at]).toEqual(['token-1', 'user-juan', NOW]);
        expect(await verifyPassword('nueva123', passwordHash)).toBe(true);
    });

    it.each([
        ['does not exist', null],
        ['was already used', storedToken({ usedAt: new Date('2026-10-16T10:00:00Z') })],
        ['expired', storedToken({ expiresAt: new Date('2026-10-16T11:59:59Z') })],
    ])('should reject a link that %s', async (_label, token) => {
        mockTokenRepository.findByTokenHash.mockResolvedValue(token);

        await expect(useCase.execute({ token: 'secret', newPassword: 'nueva123' }, NOW)).rejects.toThrow('Invalid or expired link');
        expect(mockTokenRepository.consume).not.toHaveBeenCalled();
    });
});

describe('ChangePasswordUseCase', () => {
    const useCase = new ChangePasswordUseCase(mockUserRepository);

    it('should save the new password hash when the current one is right', async () => {
        mockUserRepository.findById.mockResolvedValue(juan(await hashPassword('actual1')));

        await useCase.execute({ userId: 'user-juan', currentPassword: 'actual1', newPassword: 'nueva123' });

        const [saved] = mockUserRepository.save.mock.calls[0];
        expect(saved.id).toBe('user-juan');
        expect(await verifyPassword('nueva123', saved.password)).toBe(true);
    });

    it('should reject a wrong current password without saving (400, not 401)', async () => {
        mockUserRepository.findById.mockResolvedValue(juan(await hashPassword('actual1')));

        await expect(
            useCase.execute({ userId: 'user-juan', currentPassword: 'otra', newPassword: 'nueva123' }),
        ).rejects.toMatchObject({ status: 400, message: 'Current password is incorrect' });
        expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should reject a new password equal to the current one', async () => {
        mockUserRepository.findById.mockResolvedValue(juan(await hashPassword('actual1')));

        await expect(
            useCase.execute({ userId: 'user-juan', currentPassword: 'actual1', newPassword: 'actual1' }),
        ).rejects.toThrow('New password must be different');
    });
});

describe('GetMeUseCase', () => {
    const useCase = new GetMeUseCase(mockUserRepository);

    it('should tell whether the user is an app admin', async () => {
        mockUserRepository.findById.mockResolvedValueOnce(juan());
        mockUserRepository.findById.mockResolvedValueOnce(
            User.create({ id: 'user-admin', email: 'admin@test.com', password: 'x', name: 'Admin', appRole: AppRole.ADMIN }),
        );

        expect(await useCase.execute('user-juan')).toEqual({ id: 'user-juan', email: 'juan@test.com', name: 'Juan', isAppAdmin: false });
        expect((await useCase.execute('user-admin')).isAppAdmin).toBe(true);
    });
});
