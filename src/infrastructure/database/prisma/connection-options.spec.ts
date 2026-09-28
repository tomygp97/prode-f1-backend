import { buildConnectionOptions } from './connection-options';

const LOCAL = 'mysql://root:root@localhost:3306/prode_f1';

describe('buildConnectionOptions', () => {
  it('should keep the local setup as before (no SSL)', () => {
    const options = buildConnectionOptions({ DATABASE_URL: LOCAL });

    expect(options).toEqual({
      host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'prode_f1',
      allowPublicKeyRetrieval: true,
    });
  });

  it('should decode percent-encoded user and password (special characters)', () => {
    const options = buildConnectionOptions({ DATABASE_URL: 'mysql://av%2Badmin:p%40ss%23w0rd@db.example.com:12345/defaultdb' });

    expect(options.user).toBe('av+admin');
    expect(options.password).toBe('p@ss#w0rd');
    expect(options.port).toBe(12345);
    expect(options.database).toBe('defaultdb');
  });

  it('should encrypt and verify the server when DATABASE_SSL and a CA are set', () => {
    const options = buildConnectionOptions({
      DATABASE_URL: LOCAL,
      DATABASE_SSL: 'true',
      DATABASE_SSL_CA: '-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----',
    });

    expect(options.ssl).toEqual({
      rejectUnauthorized: true,
      ca: '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----',
    });
  });

  it('should encrypt without verifying when DATABASE_SSL is set but no CA is given', () => {
    const options = buildConnectionOptions({ DATABASE_URL: LOCAL, DATABASE_SSL: 'true' });

    expect(options.ssl).toEqual({ rejectUnauthorized: false });
  });
});
