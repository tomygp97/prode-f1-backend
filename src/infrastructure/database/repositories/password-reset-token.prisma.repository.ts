import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordResetToken } from '../../../domain/entities/password-reset-token.entity';
import { PasswordResetTokenRepository } from '../../../domain/ports/password-reset-token.repository';
import { PasswordResetTokenMapper } from '../mappers/password-reset-token.mapper';

@Injectable()
export class PasswordResetTokenPrismaRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(token: PasswordResetToken): Promise<void> {
    await this.prisma.passwordResetToken.create({ data: PasswordResetTokenMapper.toPersistence(token) });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const raw = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    return raw ? PasswordResetTokenMapper.toDomain(raw) : null;
  }

  async invalidateUnusedForUser(userId: string, now: Date): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    });
  }

  async consume(tokenId: string, userId: string, passwordHash: string, now: Date): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { password: passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: tokenId }, data: { usedAt: now } }),
    ]);
  }
}
