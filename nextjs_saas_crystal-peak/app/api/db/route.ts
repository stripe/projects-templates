import { NextResponse } from 'next/server';
import { getDatabaseSummary } from '@/lib/db';
import { databaseConfigured } from '@/lib/database-config';

function getDatabaseDashboardURL() {
  const directDashboardURL =
    process.env.NEON_DASHBOARD_URL?.trim() || process.env.NEON_POSTGRES_DASHBOARD_URL?.trim();

  if (directDashboardURL) {
    return directDashboardURL;
  }

  const projectId =
    process.env.NEON_PROJECT_ID?.trim() || process.env.NEON_POSTGRES_PROJECT_ID?.trim();
  const branchId =
    process.env.NEON_BRANCH_ID?.trim() || process.env.NEON_POSTGRES_BRANCH_ID?.trim();

  if (!projectId) {
    return null;
  }

  if (branchId) {
    return `https://console.neon.tech/app/projects/${projectId}/branches/${branchId}`;
  }

  return `https://console.neon.tech/app/projects/${projectId}`;
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
          'Add DATABASE_URL, NEON_CONNECTION_STRING, or NEON_POSTGRES_CONNECTION_STRING to inspect the starter users and subscriptions tables.',
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
      message: 'Connected to Neon Postgres. Starter tables are ready to inspect.',
      tables: summary.tables,
      version: summary.version,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to query the database.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
