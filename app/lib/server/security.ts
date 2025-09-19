import {
	createCipheriv,
	createDecipheriv,
	createHash,
	createHmac,
	randomBytes,
	timingSafeEqual,
} from 'node:crypto';
import process from 'node:process';

export type EncryptedPayload = {
	ciphertext: string;
	iv: string;
	authTag: string;
};

export type DeidentificationRedaction = {
	path: string;
	field: string;
	action: 'redact' | 'hash' | 'mask' | 'generalize';
	sample?: string;
};

export type DeidentificationResult<T = unknown> = {
	sanitized: T;
	redactions: DeidentificationRedaction[];
};

const encryptionAlgorithm = 'aes-256-gcm';
const initializationVectorLength = 12;

function getEncryptionKey(): Uint8Array {
	const secret = process.env.PHI_ENCRYPTION_KEY;
	if (!secret) {
		throw new Error(
			'PHI_ENCRYPTION_KEY environment variable is required for PHI encryption',
		);
	}

	return createHash('sha256').update(secret).digest();
}

function getTokenSecret(): string {
	const secret = process.env.PHI_TOKEN_SECRET ?? process.env.PHI_ENCRYPTION_KEY;
	if (!secret) {
		throw new Error(
			'PHI_TOKEN_SECRET (or PHI_ENCRYPTION_KEY) environment variable is required to hash PHI tokens',
		);
	}

	return secret;
}

export function generateAccessToken(byteLength = 32): string {
	return randomBytes(byteLength).toString('base64url');
}

export function encryptPhi<T = unknown>(value: T): EncryptedPayload {
	const key = getEncryptionKey();
	const iv = randomBytes(initializationVectorLength);
	const cipher = createCipheriv(encryptionAlgorithm, key, iv);
	const serialized = Buffer.from(JSON.stringify(value), 'utf8');
	const ciphertext = Buffer.concat([cipher.update(serialized), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return {
		ciphertext: ciphertext.toString('base64'),
		iv: iv.toString('base64'),
		authTag: authTag.toString('base64'),
	};
}

export function decryptPhi<T = unknown>({
	ciphertext,
	iv,
	authTag,
}: EncryptedPayload): T {
	const key = getEncryptionKey();
	const decipher = createDecipheriv(
		encryptionAlgorithm,
		key,
		Buffer.from(iv, 'base64'),
	);
	decipher.setAuthTag(Buffer.from(authTag, 'base64'));
	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(ciphertext, 'base64')),
		decipher.final(),
	]);
	return JSON.parse(decrypted.toString('utf8')) as T;
}

export function hashToken(token: string): string {
	const secret = getTokenSecret();
	return createHmac('sha256', secret).update(token).digest('hex');
}

export function verifyTokenHash(token: string, expectedHash: string): boolean {
	const actualHash = hashToken(token);
	const actualBuffer = Buffer.from(actualHash, 'utf8');
	const expectedBuffer = Buffer.from(expectedHash, 'utf8');
	if (actualBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return timingSafeEqual(actualBuffer, expectedBuffer);
}

const hashSalt = 'phi-deidentification::';

function hashIdentifier(value: string): string {
	const secret = getTokenSecret();
	return createHash('sha256')
		.update(`${hashSalt}${secret}:${value}`)
		.digest('hex')
		.slice(0, 16);
}

function maskName(value: string): string {
	if (!value) return '';
	const trimmed = value.trim();
	if (trimmed.length <= 2) return `${trimmed[0] ?? ''}*`;
	return `${trimmed[0]}${'*'.repeat(Math.max(1, trimmed.length - 2))}${trimmed.at(-1)}`;
}

function generalizeDate(value: string): string {
	const parsed = new Date(value);
	if (!Number.isNaN(parsed.getTime())) {
		const year = parsed.getUTCFullYear();
		const month = parsed.getUTCMonth() + 1;
		return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
	}

	const match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(value);
	if (match) {
		return `${match[1]}-${match[2].padStart(2, '0')}`;
	}

	return 'REDACTED';
}

type FieldRule = {
	pattern: RegExp;
	action: 'redact' | 'hash' | 'mask' | 'generalize';
};

const fieldRules: FieldRule[] = [
	{pattern: /ssn|social[_\s]?security/i, action: 'redact'},
	{pattern: /tax[_\s-]?id|tin/i, action: 'hash'},
	{pattern: /name|patient|member\s*name/i, action: 'mask'},
	{pattern: /member[_\s-]?id|subscriber|enrollee|beneficiary/i, action: 'hash'},
	{pattern: /provider[_\s-]?id/i, action: 'hash'},
	{pattern: /mrn|medical[_\s-]?record/i, action: 'hash'},
	{pattern: /dob|birth/i, action: 'generalize'},
	{pattern: /address|street|city|state|zip|postal/i, action: 'redact'},
	{pattern: /phone|fax|mobile|contact|email/i, action: 'redact'},
];

function applyRule(action: FieldRule['action'], value: unknown): string {
	const stringValue = String(value ?? '');
	switch (action) {
		case 'hash': {
			return hashIdentifier(stringValue);
		}

		case 'mask': {
			return maskName(stringValue);
		}

		case 'generalize': {
			return generalizeDate(stringValue);
		}

		case 'redact': {
			return 'REDACTED';
		}
	}

	return 'REDACTED';
}

function findRule(field: string): FieldRule | undefined {
	return fieldRules.find((rule) => rule.pattern.test(field));
}

function deidentifyValue(
	value: unknown,
	field: string,
	path: string,
	redactions: DeidentificationRedaction[],
): unknown {
	const rule = findRule(field);
	if (!rule) {
		if (Array.isArray(value)) {
			return value.map((item, index) =>
				deidentifyValue(item, field, `${path}[${index}]`, redactions),
			);
		}

		if (value && typeof value === 'object') {
			return deidentifyObject(
				value as Record<string, unknown>,
				path,
				redactions,
			);
		}

		return value;
	}

	const sanitized = applyRule(rule.action, value);
	redactions.push({
		path,
		field,
		action: rule.action,
		sample: typeof value === 'string' ? value.slice(0, 12) : undefined,
	});
	return sanitized;
}

function deidentifyObject(
	object: Record<string, unknown>,
	path: string,
	redactions: DeidentificationRedaction[],
): Record<string, unknown> {
	const sanitized: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(object)) {
		const fieldPath = path ? `${path}.${key}` : key;
		sanitized[key] = deidentifyValue(value, key, fieldPath, redactions);
	}

	return sanitized;
}

export function deidentifyPayload<T = unknown>(
	payload: T,
): DeidentificationResult<T> {
	const redactions: DeidentificationRedaction[] = [];

	const sanitized = (() => {
		if (Array.isArray(payload)) {
			return payload.map((item, index) =>
				deidentifyValue(item, String(index), `[${index}]`, redactions),
			) as T;
		}

		if (payload && typeof payload === 'object') {
			const record = payload as Record<string, unknown>;
			const result: Record<string, unknown> = {};

			for (const [key, value] of Object.entries(record)) {
				if (key === 'rows' && Array.isArray(value)) {
					result[key] = (value as unknown[]).map((row, index) => {
						if (row && typeof row === 'object') {
							return deidentifyObject(
								row as Record<string, unknown>,
								`rows[${index}]`,
								redactions,
							);
						}

						return row;
					});
					continue;
				}

				result[key] = deidentifyValue(value, key, key, redactions);
			}

			return result as T;
		}

		return payload;
	})();

	return {
		sanitized,
		redactions,
	};
}
