
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function checkTowns() {
    try {
        const res = await pool.query(`
            SELECT 
                COALESCE(c.town, 'Unknown') as town,
                count(c.id) as company_count,
                sum(mr.employees_total) as total_employees
            FROM monthly_reports mr
            JOIN companies c ON mr.company_id = c.id
            WHERE mr.report_month = (SELECT MAX(report_month) FROM monthly_reports)
            GROUP BY c.town
            ORDER BY total_employees DESC;
        `);
        console.log("Distinct Towns found:", res.rows.length);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkTowns();
