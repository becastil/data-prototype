'use client';

type TokenEntry = {
	token: string;
	expiresAt: string;
};

const storageKey = 'phi-token-index';

type TokenMap = Record<string, TokenEntry>;

function isBrowser() {
	return typeof window !== 'undefined';
}

function readStorage(): TokenMap {
	if (!isBrowser()) return {};
	try {
		const raw = window.sessionStorage.getItem(storageKey);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as TokenMap;
		return parsed ?? {};
	} catch {
		return {};
	}
}

function writeStorage(map: TokenMap) {
	if (!isBrowser()) return;
	try {
		window.sessionStorage.setItem(storageKey, JSON.stringify(map));
	} catch {
		// Ignore storage errors (e.g., quota exceeded)
	}
}

function isExpired(entry: TokenEntry): boolean {
	const expires = Date.parse(entry.expiresAt);
	if (Number.isNaN(expires)) return true;
	return Date.now() > expires;
}

export function rememberToken(category: string, entry: TokenEntry) {
	if (!category) return;
	const map = readStorage();
	map[category] = entry;
	writeStorage(map);
}

export function getStoredToken(category: string): TokenEntry | undefined {
	if (!category) return null;
	const map = readStorage();
	const entry = map[category];
	if (!entry) return null;
	if (isExpired(entry)) {
		const {[category]: _removed, ...rest} = map;
		writeStorage(rest);
		return null;
	}

	return entry;
}

export function clearStoredToken(category: string) {
	if (!category) return;
	const map = readStorage();
	if (map[category]) {
		const {[category]: _removed, ...rest} = map;
		writeStorage(rest);
	}
}

export function listStoredTokens(): Array<{
	category: string;
	token: string;
	expiresAt: string;
}> {
	const map = readStorage();
	return Object.entries(map)
		.filter(([, entry]) => !isExpired(entry))
		.map(([category, entry]) => ({
			category,
			token: entry.token,
			expiresAt: entry.expiresAt,
		}));
}
