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
  process.env.RENDER_URL,
  process.env.RENDER_DATABASE_URL,
  process.env.RENDER_POSTGRES_DATABASE_URL,

);

if (!process.env.DATABASE_URL && databaseURL) {
  process.env.DATABASE_URL = databaseURL;
}

export const databaseConfigured = Boolean(databaseURL);
