import { defineConfig } from 'drizzle-kit';
import path from 'path';

const defaultDbPath = '/home/runner/workspace/data/call-center.db';

function getSqliteDbPath(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && !envUrl.startsWith('postgresql://') && !envUrl.startsWith('postgres://')) {
    return envUrl;
  }
  return defaultDbPath;
}

const dbPath = getSqliteDbPath();

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
});
