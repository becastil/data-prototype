import { NextResponse } from 'next/server';
import { getServerAuthSession } from '../../../lib/auth';
import { enforceApiScope, AuthError } from '../../../middleware';

const REQUIRED_SCOPES = ['phi:read'] as const;

const auditLogs = [
  {
    id: 'audit-log-1',
    userId: 'system',
    action: 'bootstrap',
    cardId: 'seed-card',
    timestamp: new Date('2024-01-01T00:00:00Z').toISOString()
  }
];

export async function GET() {
  try {
    const session = await getServerAuthSession();
    enforceApiScope(session, [...REQUIRED_SCOPES]);

    return NextResponse.json({ logs: auditLogs });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.reason, message: error.message }, { status: error.status });
    }

    throw error;
  }
}
