import { PasswordResetToken as PrismaPasswordResetToken } from '@prisma/client';
import { PasswordResetToken } from '../../../domain/entities/password-reset-token.entity';

export class PasswordResetTokenMapper {
    static toDomain(raw: PrismaPasswordResetToken): PasswordResetToken {
        return PasswordResetToken.create({
            id: raw.id,
            userId: raw.userId,
            tokenHash: raw.tokenHash,
            expiresAt: raw.expiresAt,
            usedAt: raw.usedAt,
            createdById: raw.createdById,
        });
    }

    static toPersistence(token: PasswordResetToken) {
        return {
            id: token.id,
            userId: token.userId,
            tokenHash: token.tokenHash,
            expiresAt: token.expiresAt,
            usedAt: token.usedAt,
            createdById: token.createdById,
        };
    }
}
