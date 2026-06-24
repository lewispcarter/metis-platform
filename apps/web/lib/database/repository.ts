export type PersistenceMode = 'LOCAL' | 'POSTGRES';

export function getPersistenceMode(): PersistenceMode {
  const enabled =
    Boolean(process.env.POSTGRES_HOST) &&
    Boolean(process.env.POSTGRES_DATABASE) &&
    Boolean(process.env.POSTGRES_USER);

  return enabled ? 'POSTGRES' : 'LOCAL';
}
