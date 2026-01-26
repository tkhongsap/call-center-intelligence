import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

import path from 'path';

const defaultDbPath = path.join(process.cwd(), 'call-center.db');

function getSqliteDbPath(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith('postgresql://') && !envUrl.startsWith('postgres://')) {
    return envUrl;
  }
  return defaultDbPath;
}

const dbPath = getSqliteDbPath();
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
