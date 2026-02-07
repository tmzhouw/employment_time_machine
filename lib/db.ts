import 'server-only';
import { Pool } from 'pg';

// Direct PostgreSQL connection pool (for production deployment)
// Only created if DATABASE_URL is set (i.e., on Tencent Cloud with local PostgreSQL)
let pool: Pool | null = null;

export function getPgPool(): Pool | null {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return null;

    if (!pool) {
        pool = new Pool({
            connectionString: databaseUrl,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        console.log('[PG] Created PostgreSQL connection pool');
    }
    return pool;
}
