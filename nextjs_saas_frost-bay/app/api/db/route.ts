import { NextResponse } from 'next/server';
import { getDatabaseSummary } from '@/lib/db';
import { databaseConfigured } from '@/lib/database-config';

function getDatabaseDashboardURL() {
  return (
    process.env.RENDER_DASHBOARD_URL?.trim() ||
    process.env.RENDER_POSTGRES_DASHBOARD_URL?.trim() ||
    null
  );
}

export async function GET() {
  try {
    const dashboardUrl = getDatabaseDashboardURL();

    if (!databaseConfigured) {
      return NextResponse.json({
        ok: true,
        configured: false,
        connected: false,
        currentTime: null,
        dashboardUrl,
        message:
          'Add DATABASE_URL, RENDER_URL, RENDER_DATABASE_URL, or RENDER_POSTGRES_DATABASE_URL to inspect the starter users and subscriptions tables.',
        tables: [],
        version: null,
      });
    }

    const summary = await getDatabaseSummary();
    return NextResponse.json({
      ok: true,
      configured: true,
      connected: true,
      currentTime: summary.currentTime,
      dashboardUrl,
      message: 'Connected to Render Postgres. Starter tables are ready to inspect.',
      tables: summary.tables,
      version: summary.version,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to query the database.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
