
import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
    const cwd = process.cwd();
    const defaultDbPath = path.join(cwd, 'call-center.db');

    const envUrl = process.env.DATABASE_URL;
    let dbPath = defaultDbPath;
    if (envUrl && !envUrl.startsWith('postgresql://') && !envUrl.startsWith('postgres://')) {
        dbPath = envUrl;
    }

    let tables = [];
    let error = null;

    try {
        console.log('Opening DB at:', dbPath);
        const db = new Database(dbPath, { readonly: true });
        tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((t: any) => t.name);

        // Check shares specifically
        try {
            const sharesCount: any = db.prepare("SELECT count(*) as count FROM shares").get();
            tables.push(`shares_count: ${sharesCount.count}`);
        } catch (err: any) {
            tables.push(`Error querying shares: ${err.message}`);
        }
    } catch (e: any) {
        error = e.message;
    }

    return NextResponse.json({
        cwd,
        envUrl,
        dbPath,
        tables,
        error
    });
}
