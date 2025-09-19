/**
 * Security utilities for healthcare data handling
 * Follows HIPAA-aligned practices for client-side processing
 */

// Content Security Policy helper
export const generateCSPHeader = (nonce?: string) => {
	const directives = [
		`default-src 'self'`,
		`script-src 'self' 'unsafe-eval' ${nonce ? `'nonce-${nonce}'` : ''} https://cdn.jsdelivr.net`,
		`style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
		`font-src 'self' https://fonts.gstatic.com`,
		`img-src 'self' data: https:`,
		`connect-src 'self' https://api.github.com`,
		`frame-ancestors 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
	];

	return directives.join('; ');
};

// Input sanitization for healthcare data
export const sanitizeHealthcareInput = (input: string): string => {
	// Remove potentially harmful characters while preserving healthcare data format
	return input
		.replaceAll(/[<>"'&]/g, '') // XSS prevention
		.replaceAll(/[^\w\s\-./(),]/g, '') // Allow healthcare-specific chars
		.trim()
		.slice(0, 1000); // Limit length
};

// PHI detection patterns (for client-side warnings)
const PHI_PATTERNS = {
	ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
	creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
	phone: /\b(?:\d{3}[-.]?){2}\d{4}\b/g,
	email: /\b[\w.%+-]+@[A-Za-z\d.-]+\.[A-Z|a-z]{2,}\b/g,
};

export const detectPotentialPHI = (
	text: string,
): Array<{type: string; count: number}> => {
	const detections = [];

	for (const [type, pattern] of Object.entries(PHI_PATTERNS)) {
		const matches = text.match(pattern);
		if (matches) {
			detections.push({type, count: matches.length});
		}
	}

	return detections;
};

// Rate limiting for client-side operations
class RateLimiter {
	private readonly attempts = new Map<string, number[]>();

	isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
		const now = Date.now();
		const attempts = this.attempts.get(key) || [];

		// Remove old attempts outside the window
		const validAttempts = attempts.filter((time) => now - time < windowMs);

		if (validAttempts.length >= maxAttempts) {
			return false;
		}

		validAttempts.push(now);
		this.attempts.set(key, validAttempts);
		return true;
	}

	reset(key: string): void {
		this.attempts.delete(key);
	}
}

export const rateLimiter = new RateLimiter();

// Secure random ID generation
export const generateSecureId = (prefix = '', length = 16): string => {
	const array = new Uint8Array(length);
	if (typeof window !== 'undefined' && window.crypto) {
		window.crypto.getRandomValues(array);
	} else {
		// Fallback for server-side or unsupported environments
		for (let i = 0; i < length; i++) {
			array[i] = Math.floor(Math.random() * 256);
		}
	}

	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[array[i] % chars.length];
	}

	return prefix ? `${prefix}_${result}` : result;
};

// Environment validation
export const validateEnvironment = () => {
	if (typeof window === 'undefined') return; // Server-side skip

	const warnings: string[] = [];

	// Check for development mode in production
	if (
		process.env.NODE_ENV === 'production' &&
		window.location.protocol !== 'https:' &&
		window.location.hostname !== 'localhost'
	) {
		warnings.push('Production site should use HTTPS');
	}

	// Check for debugging tools
	if (process.env.NODE_ENV === 'production' && (window as any).React) {
		warnings.push('React DevTools detected in production');
	}

	// Warn if in development but accessing real-looking URLs
	if (
		process.env.NODE_ENV === 'development' &&
		window.location.hostname.includes('.com')
	) {
		warnings.push('Development mode accessing production-like domain');
	}

	if (warnings.length > 0) {
		console.warn('Security warnings:', warnings);
	}

	return warnings;
};

// Client-side secrets detection
export const hasSecretsInCode = (text: string): boolean => {
	const secretPatterns = [
		/(?:password|pwd|secret|key|token|api_key|apikey)\s*[:=]\s*['"][^'"]+['"]/gi,
		/(?:sk-|pk_live_|pk_test_)[a-z\d]{20,}/gi,
		/[a-zA-Z\d]{32,}/g, // Generic long strings that might be keys
	];

	return secretPatterns.some((pattern) => pattern.test(text));
};

// Security headers for API responses
export const securityHeaders = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'X-XSS-Protection': '1; mode=block',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

type ServerSecurityModule = typeof import('./server/security');

let serverSecurityModule: Promise<ServerSecurityModule> | undefined = null;

async function loadServerSecurity(): Promise<ServerSecurityModule> {
	if (typeof window !== 'undefined') {
		throw new TypeError(
			'Server security utilities can only be used in a server environment',
		);
	}

	serverSecurityModule ||= import('./server/security.js');

	return serverSecurityModule;
}

export type {
	DeidentificationRedaction,
	DeidentificationResult,
	EncryptedPayload,
} from './server/security.js';

export async function encryptPHIPayload<T = unknown>(value: T) {
	const module_ = await loadServerSecurity();
	return module_.encryptPhi(value);
}

export async function decryptPHIPayload<T = unknown>(
	payload: import('./server/security').EncryptedPayload,
) {
	const module_ = await loadServerSecurity();
	return module_.decryptPhi<T>(payload);
}

export async function generateShortLivedToken(byteLength = 32) {
	const module_ = await loadServerSecurity();
	return module_.generateAccessToken(byteLength);
}

export async function hashSecureToken(token: string) {
	const module_ = await loadServerSecurity();
	return module_.hashToken(token);
}

export async function verifySecureToken(token: string, expectedHash: string) {
	const module_ = await loadServerSecurity();
	return module_.verifyTokenHash(token, expectedHash);
}

export async function deidentifySensitivePayload<T = unknown>(payload: T) {
	const module_ = await loadServerSecurity();
	return module_.deidentifyPayload(payload);
}
