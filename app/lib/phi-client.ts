'use client';

import {
	clearStoredToken,
	getStoredToken,
	rememberToken,
} from './client-tokens.js';
import type {DeidentificationRedaction} from './server/security.js';

type CreateRecordResponse<T = unknown> = {
	token: string;
	expiresAt: string;
	sanitized: T;
	redactions: DeidentificationRedaction[];
};

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const message = await response.text().catch(() => '');
		throw new Error(message || `Request failed with status ${response.status}`);
	}

	return response.json() as Promise<T>;
}

export async function persistSecureRecord<T = unknown>(
	category: string,
	payload: T,
	options: {ttlSeconds?: number; metadata?: Record<string, unknown>} = {},
): Promise<CreateRecordResponse<T>> {
	const response = await fetch('/api/secure-records', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({
			category,
			payload,
			ttlSeconds: options.ttlSeconds,
			metadata: options.metadata,
		}),
	});

	const result = await handleResponse<CreateRecordResponse<T>>(response);
	rememberToken(category, {token: result.token, expiresAt: result.expiresAt});
	return result;
}

export async function retrieveSanitizedRecord<T = unknown>(
	category: string,
): Promise<CreateRecordResponse<T> | undefined> {
	const entry = getStoredToken(category);
	if (!entry) return null;

	const response = await fetch(`/api/secure-records/${entry.token}`);
	if (response.status === 404) {
		clearStoredToken(category);
		return null;
	}

	const result = await handleResponse<CreateRecordResponse<T>>(response);
	rememberToken(category, {token: result.token, expiresAt: result.expiresAt});
	return result;
}

export async function revokeSecureRecord(category: string): Promise<void> {
	const entry = getStoredToken(category);
	if (!entry) return;

	try {
		await fetch(`/api/secure-records/${entry.token}`, {method: 'DELETE'});
	} finally {
		clearStoredToken(category);
	}
}

export async function logPhiAccessEvent(input: {
	resourceId: string;
	userId: string;
	action: string;
	justification?: string;
	details?: Record<string, unknown> | undefined;
	token?: string;
	category?: string;
}) {
	const response = await fetch('/api/compliance/access-log', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(input),
	});

	return handleResponse(response);
}

export {
	rememberToken,
	clearStoredToken,
	getStoredToken,
} from './client-tokens.js';
