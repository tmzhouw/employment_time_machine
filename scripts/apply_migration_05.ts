import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function main() {
    const sqlPath = path.join(process.cwd(), 'db/migrations/05_add_salary_mgmt.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    if (process.env.DATABASE_URL) {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        console.log('Running migration on local PostgreSQL...');
        try {
            await pool.query(sql);
            console.log('✅ Local migration successful.');
        } catch (e) {
            console.error('❌ Local migration failed:', e);
        } finally {
            await pool.end();
        }
    } else {
        console.log('Local pool not found. Attempting Supabase...');
        console.warn('\n⚠️  Please run the following SQL manually in the Supabase SQL Editor:');
        console.log('--------------------------------------------------');
        console.log(sql);
        console.log('--------------------------------------------------');
    }
    process.exit(0);
}

main().catch(console.error);
