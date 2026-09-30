import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('should answer ok with uptime and timestamp, without touching the database', () => {
    const result = new HealthController().check();

    expect(result.status).toBe('ok');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });
});
