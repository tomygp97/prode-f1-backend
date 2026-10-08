/** Email sin espacios y en minúsculas: así se guarda y así se busca al loguear. */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}
