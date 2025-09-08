import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const now = new Date();
  const uptime = Math.round(process.uptime());

  return NextResponse.json({
    status: 'ok',
    time: now.toISOString(),
    uptimeSeconds: uptime,
    environment: process.env.NODE_ENV || 'development',
  });
}

