import {NextResponse} from 'next/server';
import {
	fetchPhiAccessLogs,
	recordPhiAccess,
} from '@/app/lib/server/phi-storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const {
			resourceId,
			userId,
			action,
			justification,
			details,
			token,
			category,
		} = body ?? {};

		if (!resourceId || !userId || !action) {
			return NextResponse.json(
				{error: 'resourceId, userId, and action are required'},
				{status: 400},
			);
		}

		const entry = await recordPhiAccess({
			resourceId,
			userId,
			action,
			justification,
			details: details ?? null,
			token,
			category,
		});

		return NextResponse.json(entry, {status: 201});
	} catch (error) {
		console.error('Failed to record PHI access', error);
		return NextResponse.json(
			{error: 'Failed to record PHI access'},
			{status: 500},
		);
	}
}

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const limit = url.searchParams.get('limit');
		const offset = url.searchParams.get('offset');
		const from = url.searchParams.get('from');
		const to = url.searchParams.get('to');
		const summary = url.searchParams.get('summary') === 'true';

		const parsedFrom = from ? Date.parse(from) : undefined;
		const parsedTo = to ? Date.parse(to) : undefined;

		const result = fetchPhiAccessLogs({
			limit: limit ? Number.parseInt(limit, 10) : undefined,
			offset: offset ? Number.parseInt(offset, 10) : undefined,
			from: parsedFrom && !Number.isNaN(parsedFrom) ? parsedFrom : undefined,
			to: parsedTo && !Number.isNaN(parsedTo) ? parsedTo : undefined,
			summary,
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error('Failed to fetch PHI access logs', error);
		return NextResponse.json(
			{error: 'Failed to fetch PHI access logs'},
			{status: 500},
		);
	}
}
