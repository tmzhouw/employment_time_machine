import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Starting Migration 03: Admin Hub V2...');

    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
    });

    try {
        const sqlPath = path.join(__dirname, '../db/migrations/03_admin_hub_v2.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await pool.query(sql);

        console.log('✅ Migration 03 applied successfully.');
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

main();
