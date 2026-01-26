
const Database = require('better-sqlite3');
const db = new Database('data/call-center.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in data/call-center.db:', tables.map(t => t.name));
