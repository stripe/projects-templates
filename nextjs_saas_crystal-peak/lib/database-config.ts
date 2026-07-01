function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }

  return '';
}

export const databaseURL = firstNonEmpty(
  process.env.DATABASE_URL,
  process.env.NEON_CONNECTION_STRING,
  process.env.NEON_POSTGRES_CONNECTION_STRING,

);

if (!process.env.DATABASE_URL && databaseURL) {
  process.env.DATABASE_URL = databaseURL;
}

export const databaseConfigured = Boolean(databaseURL);
