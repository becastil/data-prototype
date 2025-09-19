import {getPhiDatabase} from './database.js';
import {
	deidentifyPayload,
	encryptPhi,
	generateAccessToken,
	hashToken,
} from './security.js';

type CreateSecureRecordOptions = {
	ttlSeconds?: number;
	metadata?: Record<string, unknown> | undefined;
};

export type SecureRecordResponse<T = unknown> = {
	token: string;
	expiresAt: string;
	sanitized: T;
	redactions: Array<import('./security').DeidentificationRedaction>;
};

function clampTtlSeconds(ttlSeconds?: number): number {
	const DEFAULT_TTL = 15 * 60; // 15 minutes
	const MAX_TTL = 24 * 60 * 60; // 24 hours
	const MIN_TTL = 60; // 1 minute

	if (typeof ttlSeconds !== 'number' || Number.isNaN(ttlSeconds)) {
		return DEFAULT_TTL;
	}

	return Math.min(Math.max(ttlSeconds, MIN_TTL), MAX_TTL);
}

function cleanupExpiredRecords(now = Date.now()) {
	const database = getPhiDatabase();
	const stmt = database.prepare(
		'DELETE FROM phi_records WHERE expires_at <= ?',
	);
	stmt.run(now);
}

export async function createSecureRecord<T = unknown>(
	category: string,
	payload: T,
	options: CreateSecureRecordOptions = {},
): Promise<SecureRecordResponse<T>> {
	const ttlSeconds = clampTtlSeconds(options.ttlSeconds);
	const now = Date.now();
	const expiresAt = now + ttlSeconds * 1000;

	cleanupExpiredRecords(now);

	const sanitized = deidentifyPayload(payload);
	const encrypted = encryptPhi(payload);
	const token = generateAccessToken();

	const tokenHash = hashToken(token);
	const database = getPhiDatabase();
	const insert = database.prepare(
		`INSERT INTO phi_records (token_hash, category, encrypted_data, iv, auth_tag, sanitized, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	);

	const persisted = {
		sanitized: JSON.stringify({
			sanitized: sanitized.sanitized,
			redactions: sanitized.redactions,
			metadata: options.metadata ?? null,
		}),
		encrypted: Buffer.from(encrypted.ciphertext, 'base64'),
		iv: Buffer.from(encrypted.iv, 'base64'),
		authTag: Buffer.from(encrypted.authTag, 'base64'),
	};

	insert.run(
		tokenHash,
		category,
		persisted.encrypted,
		persisted.iv,
		persisted.authTag,
		persisted.sanitized,
		expiresAt,
		now,
	);

	return {
		token,
		expiresAt: new Date(expiresAt).toISOString(),
		sanitized: sanitized.sanitized,
		redactions: sanitized.redactions,
	};
}

export async function getSanitizedRecord<T = unknown>(
	token: string,
): Promise<SecureRecordResponse<T> | undefined> {
	const database = getPhiDatabase();
	const tokenHash = hashToken(token);
	const row = database
		.prepare(
			'SELECT sanitized, expires_at, category FROM phi_records WHERE token_hash = ?',
		)
		.get(tokenHash) as
		| {sanitized: string; expires_at: number; category: string}
		| undefined;

	if (!row) {
		return null;
	}

	if (row.expires_at <= Date.now()) {
		await deleteSecureRecord(token);
		return null;
	}

	const parsed = JSON.parse(row.sanitized) as {
		sanitized: T;
		redactions: Array<import('./security').DeidentificationRedaction>;
	};

	return {
		token,
		expiresAt: new Date(row.expires_at).toISOString(),
		sanitized: parsed.sanitized,
		redactions: parsed.redactions,
	};
}

export async function deleteSecureRecord(token: string): Promise<void> {
	const database = getPhiDatabase();
	const tokenHash = hashToken(token);
	database
		.prepare('DELETE FROM phi_records WHERE token_hash = ?')
		.run(tokenHash);
}

export type PhiAccessLogEntry = {
	id: number;
	resourceId: string;
	tokenHash?: string | undefined;
	category?: string | undefined;
	userId: string;
	action: string;
	justification?: string | undefined;
	details?: Record<string, unknown> | undefined;
	timestamp: string;
};

type RecordPhiAccessInput = {
	resourceId: string;
	userId: string;
	action: string;
	justification?: string;
	details?: Record<string, unknown> | undefined;
	token?: string;
	category?: string;
};

export async function recordPhiAccess(
	input: RecordPhiAccessInput,
): Promise<PhiAccessLogEntry> {
	const database = getPhiDatabase();
	const now = Date.now();
	const tokenHash = input.token ? hashToken(input.token) : null;
	const details = input.details ? JSON.stringify(input.details) : null;

	const stmt = database.prepare(
		`INSERT INTO phi_access_log (resource_id, token_hash, category, user_id, action, justification, details, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	);
	const result = stmt.run(
		input.resourceId,
		tokenHash,
		input.category ?? null,
		input.userId,
		input.action,
		input.justification ?? null,
		details,
		now,
	);

	return {
		id: Number(result.lastInsertRowid),
		resourceId: input.resourceId,
		tokenHash,
		category: input.category ?? null,
		userId: input.userId,
		action: input.action,
		justification: input.justification ?? null,
		details: input.details ?? null,
		timestamp: new Date(now).toISOString(),
	};
}

type FetchAccessLogsOptions = {
	limit?: number;
	offset?: number;
	from?: number;
	to?: number;
	summary?: boolean;
};

export function fetchPhiAccessLogs(options: FetchAccessLogsOptions = {}) {
	const database = getPhiDatabase();
	const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
	const offset = Math.max(options.offset ?? 0, 0);
	const to = options.to ?? Date.now();
	const from = options.from ?? to - 30 * 24 * 60 * 60 * 1000; // Default 30 days

	const entries = database
		.prepare(
			`SELECT id, resource_id, token_hash, category, user_id, action, justification, details, timestamp
       FROM phi_access_log
       WHERE timestamp BETWEEN ? AND ?
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`,
		)
		.all(from, to, limit, offset) as Array<{
		id: number;
		resource_id: string;
		token_hash: string | undefined;
		category: string | undefined;
		user_id: string;
		action: string;
		justification: string | undefined;
		details: string | undefined;
		timestamp: number;
	}>;

	const normalizedEntries: PhiAccessLogEntry[] = entries.map((entry) => ({
		id: entry.id,
		resourceId: entry.resource_id,
		tokenHash: entry.token_hash,
		category: entry.category,
		userId: entry.user_id,
		action: entry.action,
		justification: entry.justification,
		details: entry.details
			? (JSON.parse(entry.details) as Record<string, unknown>)
			: null,
		timestamp: new Date(entry.timestamp).toISOString(),
	}));

	let summary: Array<{action: string; count: number}> = [];
	if (options.summary) {
		summary = database
			.prepare(
				`SELECT action, COUNT(*) as count
         FROM phi_access_log
         WHERE timestamp BETWEEN ? AND ?
         GROUP BY action`,
			)
			.all(from, to) as Array<{action: string; count: number}>;
	}

	return {
		entries: normalizedEntries,
		summary,
		window: {
			from: new Date(from).toISOString(),
			to: new Date(to).toISOString(),
		},
	};
}
