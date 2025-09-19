import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const GLOBAL_KEY = Symbol.for('phi:database');

type GlobalWithDatabase = typeof globalThis & {
	[GLOBAL_KEY]?: Database.Database;
};

function resolveDatabasePath(): string {
	const configured = process.env.PHI_DB_PATH;
	if (configured) {
		return configured;
	}

	return path.join(process.cwd(), 'data', 'phi-storage.sqlite');
}

function ensureDirectoryExists(filePath: string) {
	if (filePath === ':memory:' || filePath === '') return;
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, {recursive: true});
	}
}

function initializeSchema(database: Database.Database) {
	database.pragma('journal_mode = WAL');
	database.pragma('foreign_keys = ON');

	database.exec(`
    CREATE TABLE IF NOT EXISTS phi_records (
      token_hash TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      encrypted_data BLOB NOT NULL,
      iv BLOB NOT NULL,
      auth_tag BLOB NOT NULL,
      sanitized TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS phi_access_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id TEXT NOT NULL,
      token_hash TEXT,
      category TEXT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      justification TEXT,
      details TEXT,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_phi_records_expires ON phi_records(expires_at);
    CREATE INDEX IF NOT EXISTS idx_phi_access_log_timestamp ON phi_access_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_phi_access_log_resource ON phi_access_log(resource_id);
  `);
}

export function getPhiDatabase(): Database.Database {
	const globalReference = globalThis as GlobalWithDatabase;
	if (globalReference[GLOBAL_KEY]) {
		return globalReference[GLOBAL_KEY]!;
	}

	const databasePath = resolveDatabasePath();
	ensureDirectoryExists(databasePath);

	const database = new Database(databasePath);
	initializeSchema(database);
	globalReference[GLOBAL_KEY] = database;
	return database;
}

export function resetPhiDatabaseForTests() {
	if (process.env.NODE_ENV !== 'test') return;
	const globalReference = globalThis as GlobalWithDatabase;
        if (globalReference[GLOBAL_KEY]) {
                globalReference[GLOBAL_KEY]!.close();
                globalReference[GLOBAL_KEY] = undefined;
        }
}
