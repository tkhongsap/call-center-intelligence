
const path = require('path');
const Database = require('better-sqlite3');

console.log('CWD:', process.cwd());
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const defaultDbPath = path.join(process.cwd(), 'call-center.db');
function getSqliteDbPath() {
    const envUrl = process.env.DATABASE_URL;
    if (envUrl && !envUrl.startsWith('postgresql://') && !envUrl.startsWith('postgres://')) {
        return envUrl;
    }
    return defaultDbPath;
}

const dbPath = getSqliteDbPath();
console.log('Resolved DB Path:', dbPath);

try {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables found:', tables.map(t => t.name));
} catch (e) {
    console.error('Error opening DB:', e);
}
