import {describe, it, expect, beforeEach, beforeAll} from 'vitest';
import {
	decryptPhi,
	deidentifyPayload,
	encryptPhi,
	hashToken,
	verifyTokenHash,
} from '../app/lib/server/security';
import {
	createSecureRecord,
	deleteSecureRecord,
	fetchPhiAccessLogs,
	getSanitizedRecord,
	recordPhiAccess,
} from '../app/lib/server/phi-storage';
import {
	getPhiDatabase,
	resetPhiDatabaseForTests,
} from '../app/lib/server/database';

beforeAll(() => {
	process.env.PHI_ENCRYPTION_KEY = 'unit-test-secret';
	process.env.PHI_TOKEN_SECRET = 'unit-test-token-secret';
	process.env.PHI_DB_PATH = ':memory:';
	process.env.NODE_ENV = 'test';
});

beforeEach(() => {
	resetPhiDatabaseForTests();
});

describe('server security utilities', () => {
	it('encrypts and decrypts PHI payloads', () => {
		const payload = {memberId: '12345', amount: 1200};
		const encrypted = encryptPhi(payload);
		const decrypted = decryptPhi<typeof payload>(encrypted);
		expect(decrypted).toEqual(payload);
	});

	it('de-identifies sensitive fields', () => {
		const payload = {
			rows: [
				{
					memberId: 'A12345',
					ssn: '123-45-6789',
					email: 'patient@example.com',
					amount: '100',
				},
			],
		};

		const result = deidentifyPayload(payload);
		expect(result.redactions.length).toBeGreaterThan(0);
		expect(result.sanitized.rows[0].ssn).toBe('REDACTED');
		expect(result.sanitized.rows[0].email).toBe('REDACTED');
		expect(result.sanitized.rows[0].memberId).not.toBe('A12345');
	});

	it('hashes tokens deterministically', () => {
		const token = 'example-token';
		const hash = hashToken(token);
		expect(hash).toHaveLength(64);
		expect(verifyTokenHash(token, hash)).toBe(true);
	});
});

describe('secure record storage', () => {
	beforeEach(() => {
		resetPhiDatabaseForTests();
	});

	it('creates and retrieves sanitized records', async () => {
		const payload = {rows: [{memberId: '10', amount: 400}]};
		const record = await createSecureRecord('test-category', payload, {
			ttlSeconds: 120,
		});
		expect(record.token).toBeTruthy();
		expect(record.sanitized.rows[0].memberId).not.toBe('10');

		const retrieved = await getSanitizedRecord<typeof payload>(record.token);
		expect(retrieved?.sanitized.rows[0].memberId).toBe(
			record.sanitized.rows[0].memberId,
		);

		await deleteSecureRecord(record.token);
		const deleted = await getSanitizedRecord(record.token);
		expect(deleted).toBeNull();
	});

	it('expires tokens that fall outside the TTL window', async () => {
		const payload = {rows: [{memberId: '10', amount: 400}]};
		const record = await createSecureRecord('test-category', payload, {
			ttlSeconds: 120,
		});

		const database = getPhiDatabase();
		database
			.prepare('UPDATE phi_records SET expires_at = ?')
			.run(Date.now() - 1000);

		const expired = await getSanitizedRecord(record.token);
		expect(expired).toBeNull();
	});

	it('records PHI access events for compliance reporting', async () => {
		await recordPhiAccess({
			resourceId: 'card-123',
			userId: 'user-1',
			action: 'view',
			justification: 'clinical review',
			category: 'card',
		});

		const logs = fetchPhiAccessLogs({summary: true});
		expect(logs.entries.length).toBe(1);
		expect(logs.entries[0].resourceId).toBe('card-123');
		expect(logs.summary[0].action).toBe('view');
	});
});
