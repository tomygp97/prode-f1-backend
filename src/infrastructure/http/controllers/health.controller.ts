import { Controller, Get } from '@nestjs/common';

/**
 * Chequeo de vida para el deploy. Lo usan:
 * - el "ping" externo (cron-job.org / UptimeRobot) cada ~14 min, para que Render no duerma el
 *   servicio (dormido no corren los crons);
 * - la plataforma, para saber si la app arrancó bien (health check).
 * No toca la base ni OpenF1 a propósito: responde en milisegundos y no genera carga.
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
