import { NextResponse } from 'next/server';
import { deleteSecureRecord, getSanitizedRecord } from '@/app/lib/server/phi-storage';

export const runtime = 'nodejs';

interface RouteContext {
  params: { token: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { token } = params;
  try {
    const record = await getSanitizedRecord(token);
    if (!record) {
      return NextResponse.json({ error: 'Token not found or expired' }, { status: 404 });
    }

    return NextResponse.json({
      token: record.token,
      expiresAt: record.expiresAt,
      sanitized: record.sanitized,
      redactions: record.redactions,
    });
  } catch (error) {
    console.error('Failed to retrieve secure record', error);
    return NextResponse.json({ error: 'Failed to retrieve secure record' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { token } = params;
  try {
    await deleteSecureRecord(token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete secure record', error);
    return NextResponse.json({ error: 'Failed to delete secure record' }, { status: 500 });
  }
}
