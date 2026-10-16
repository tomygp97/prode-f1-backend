import { BadRequestException, Injectable } from "@nestjs/common";
import { PasswordResetTokenRepository } from "../../domain/ports/password-reset-token.repository";
import { hashPassword } from "./password-hasher";
import { hashResetToken } from "./reset-token";

/** El usuario abre el link y elige su nueva contraseña. El link sirve una sola vez. */
@Injectable()
export class ResetPasswordUseCase {
    constructor(private readonly tokenRepository: PasswordResetTokenRepository) {}

    async execute(input: { token: string; newPassword: string }, now: Date = new Date()): Promise<void> {
        const resetToken = await this.tokenRepository.findByTokenHash(hashResetToken(input.token));
        if (!resetToken || !resetToken.isUsable(now)) {
            throw new BadRequestException('Invalid or expired link');
        }

        const passwordHash = await hashPassword(input.newPassword);
        await this.tokenRepository.consume(resetToken.id, resetToken.userId, passwordHash, now);
    }
}
