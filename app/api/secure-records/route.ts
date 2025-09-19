import { NextResponse } from 'next/server';
import { createSecureRecord } from '@/app/lib/server/phi-storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, payload, ttlSeconds, metadata } = body ?? {};

    if (!category || !payload) {
      return NextResponse.json(
        { error: 'category and payload are required' },
        { status: 400 }
      );
    }

    const result = await createSecureRecord(category, payload, {
      ttlSeconds,
      metadata: metadata ?? null,
    });

    return NextResponse.json(
      {
        token: result.token,
        expiresAt: result.expiresAt,
        sanitized: result.sanitized,
        redactions: result.redactions,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create secure record', error);
    return NextResponse.json({ error: 'Failed to persist secure record' }, { status: 500 });
  }
}
