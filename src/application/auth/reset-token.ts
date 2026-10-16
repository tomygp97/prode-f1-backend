import { createHash, randomBytes } from 'crypto';

/** Token para el link (va en la URL) + su SHA-256 (lo único que se guarda). */
export function generateResetToken(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}
