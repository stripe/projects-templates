import { neon } from '@neondatabase/serverless';
import { databaseURL } from '@/lib/database-config';

export type DatabaseClient = ReturnType<typeof neon>;

type DatabaseHealthRow = {
  current_time: string;
  purchases_table_ready: boolean;
  users_table_ready: boolean;
  version: string;
};

export type DatabaseTableSummary = {
  label: string;
  name: string;
  rowCount: number;
};

export type DatabaseSummary = {
  currentTime: string;
  tables: DatabaseTableSummary[];
  version: string;
};

let schemaPromise: Promise<void> | null = null;


export function getDatabaseClient(): DatabaseClient {
  if (!databaseURL) {
    throw new Error(
      'Missing database connection string. Stripe Projects should provide DATABASE_URL, NEON_CONNECTION_STRING, or NEON_POSTGRES_CONNECTION_STRING.',
    );
  }

  return neon(databaseURL);

}

export async function ensureDatabaseSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getDatabaseClient();

      await sql`
        create table if not exists users (
          id text primary key,
          clerk_user_id text unique,
          email text,
          stripe_customer_id text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;

      await sql`
        create table if not exists purchases (
          id text primary key,
          user_id text references users(id) on delete set null,
          stripe_payment_intent_id text not null unique,
          stripe_customer_id text,
          stripe_checkout_session_id text not null unique,
          status text not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;

      await sql`
        create index if not exists purchases_user_id_idx
        on purchases (user_id)
      `;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  await schemaPromise;
}

export async function queryDatabase() {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const rows = (await sql`
    select
      now() as current_time,
      version() as version,
      to_regclass('public.users') is not null as users_table_ready,
      to_regclass('public.purchases') is not null as purchases_table_ready
  `) as Array<Record<string, unknown>>;

  return rows[0] as DatabaseHealthRow;
}

function asCount(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export async function getDatabaseSummary(): Promise<DatabaseSummary> {
  await ensureDatabaseSchema();

  const sql = getDatabaseClient();
  const rows = (await sql`
    select
      now()::text as current_time,
      version() as version,
      (select count(*)::int from users) as users_count,
      (select count(*)::int from purchases) as purchases_count
  `) as Array<Record<string, unknown>>;

  const row = rows[0] ?? {};

  return {
    currentTime: typeof row.current_time === 'string' ? row.current_time : '',
    tables: [
      {
        label: 'Users',
        name: 'users',
        rowCount: asCount(row.users_count),
      },
      {
        label: 'Purchases',
        name: 'purchases',
        rowCount: asCount(row.purchases_count),
      },
    ],
    version: typeof row.version === 'string' ? row.version : '',
  };
}
