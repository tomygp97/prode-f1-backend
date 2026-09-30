/**
 * Opciones de conexión para el adapter de MySQL/MariaDB a partir de las variables de entorno.
 *
 * - DATABASE_URL: mysql://USER:PASSWORD@HOST:PORT/DB (usuario y contraseña pueden venir
 *   percent-encoded, ej. una contraseña con "@" o "#": se decodifican).
 * - DATABASE_SSL=true: conexión cifrada (obligatoria en bases administradas como Aiven).
 * - DATABASE_SSL_CA: certificado CA en PEM (el "CA certificate" de Aiven). Con él también se
 *   verifica que el servidor sea el verdadero; sin él la conexión va cifrada pero sin verificar.
 *   Se puede pegar con saltos de línea reales o escapados como \n.
 */
export interface MariaDbConnectionOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  allowPublicKeyRetrieval: boolean;
  ssl?: { rejectUnauthorized: boolean; ca?: string };
}

export function buildConnectionOptions(env: NodeJS.ProcessEnv): MariaDbConnectionOptions {
  const url = new URL(env.DATABASE_URL as string);

  const options: MariaDbConnectionOptions = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace('/', ''),
    allowPublicKeyRetrieval: true,
  };

  if (env.DATABASE_SSL === 'true') {
    const ca = env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim();
    options.ssl = ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: false };
  }

  return options;
}
