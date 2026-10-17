// Link de un solo uso para restablecer la contraseña. Solo se conoce el hash del token.
export class PasswordResetToken {
    private constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly tokenHash: string,
        public readonly expiresAt: Date,
        public readonly usedAt: Date | null,
        public readonly createdById: string,
    ) {}

    static create(props: {
        id: string;
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        usedAt?: Date | null;
        createdById: string;
    }): PasswordResetToken {
        return new PasswordResetToken(
            props.id, props.userId, props.tokenHash, props.expiresAt, props.usedAt ?? null, props.createdById,
        );
    }

    /** Sirve si no se usó y no venció. */
    isUsable(now: Date = new Date()): boolean {
        return this.usedAt === null && this.expiresAt.getTime() > now.getTime();
    }
}
