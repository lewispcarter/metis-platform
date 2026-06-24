export const postgresConfig = {
  host: process.env.POSTGRES_HOST ?? '',
  port: Number(process.env.POSTGRES_PORT ?? '5432'),
  database: process.env.POSTGRES_DATABASE ?? '',
  username: process.env.POSTGRES_USER ?? '',
  password: process.env.POSTGRES_PASSWORD ?? '',
};

export const postgresEnabled =
  Boolean(postgresConfig.host) &&
  Boolean(postgresConfig.database) &&
  Boolean(postgresConfig.username);

export function getPostgresReadiness() {
  if (!postgresEnabled) {
    return {
      mode: 'LOCAL',
      ready: false,
      message: 'PostgreSQL is not configured. Local prototype persistence remains active.',
    };
  }

  return {
    mode: 'POSTGRES',
    ready: true,
    message: 'PostgreSQL environment values are configured.',
  };
}
