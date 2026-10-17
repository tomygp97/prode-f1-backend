import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { UserRepository } from "../../domain/ports/user.repository";
import { PasswordResetTokenRepository } from "../../domain/ports/password-reset-token.repository";
import { PasswordResetToken } from "../../domain/entities/password-reset-token.entity";
import { normalizeEmail } from "./normalize-email";
import { generateResetToken } from "./reset-token";

export const RESET_LINK_TTL_HOURS = 24;

export interface PasswordResetLink {
    url: string;
    expiresAt: Date;
    userName: string;
}

/**
 * Un admin de la app genera un link de un solo uso para que un usuario elija una nueva
 * contraseña (se lo manda por WhatsApp: no hay envío de emails). El endpoint lo protege
 * AppAdminGuard. Generar uno nuevo invalida los anteriores de ese usuario.
 */
@Injectable()
export class CreatePasswordResetLinkUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly tokenRepository: PasswordResetTokenRepository,
    ) {}

    async execute(
        input: { adminUserId: string; email: string },
        now: Date = new Date(),
        appUrl: string = process.env.APP_URL ?? 'http://localhost:3000',
    ): Promise<PasswordResetLink> {
        const user = await this.userRepository.findByEmail(normalizeEmail(input.email));
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.tokenRepository.invalidateUnusedForUser(user.id, now);

        const { token, tokenHash } = generateResetToken();
        const expiresAt = new Date(now.getTime() + RESET_LINK_TTL_HOURS * 60 * 60 * 1000);
        await this.tokenRepository.create(PasswordResetToken.create({
            id: randomUUID(),
            userId: user.id,
            tokenHash,
            expiresAt,
            createdById: input.adminUserId,
        }));

        return {
            url: `${appUrl.replace(/\/+$/, '')}/reset-password?token=${token}`,
            expiresAt,
            userName: user.name,
        };
    }
}
