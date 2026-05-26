import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '@/services/dashboard-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const snapshot = await getDashboardSnapshot();
  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
