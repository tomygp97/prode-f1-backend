import { PasswordResetToken } from '../entities/password-reset-token.entity';

export abstract class PasswordResetTokenRepository {
  abstract create(token: PasswordResetToken): Promise<void>;
  abstract findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  /** Marca como usados los links pendientes del usuario (al generar uno nuevo, el anterior deja de servir). */
  abstract invalidateUnusedForUser(userId: string, now: Date): Promise<void>;
  /** Guarda la nueva contraseña (ya hasheada) y marca el link como usado, en una sola transacción. */
  abstract consume(tokenId: string, userId: string, passwordHash: string, now: Date): Promise<void>;
}
