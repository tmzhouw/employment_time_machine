
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function checkData() {
    try {
        const res = await pool.query(`
            SELECT 
                c.name,
                c.industry,
                mr.report_month, 
                mr.employees_total,
                mr.recruited_new, 
                mr.resigned_total 
            FROM monthly_reports mr
            JOIN companies c ON mr.company_id = c.id
            WHERE c.industry LIKE '%纺织%' 
            ORDER BY mr.report_month DESC
            LIMIT 20;
        `);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkData();
