#!/usr/bin/env node

/**
 * Convert Supabase CSV exports to SQL INSERT statements
 * for importing into local PostgreSQL
 */

const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'db');
const OUTPUT_FILE = path.join(DB_DIR, 'seed_data.sql');

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i++; // skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function escapeSQL(val) {
    if (val === '' || val === undefined || val === null) return 'NULL';
    return "'" + val.replace(/'/g, "''") + "'";
}

function processCompanies() {
    const content = fs.readFileSync(path.join(DB_DIR, 'companies_rows-2.csv'), 'utf-8');
    const lines = content.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());
    const header = parseCSVLine(lines[0]);

    let sql = '-- Companies data\n';
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (fields.length < 2) continue;

        const [id, name, town, industry, contact_person, contact_phone, access_code, created_at] = fields;

        sql += `INSERT INTO companies (id, name, town, industry, contact_person, contact_phone, access_code, created_at) VALUES (${escapeSQL(id)}, ${escapeSQL(name)}, ${escapeSQL(town)}, ${escapeSQL(industry)}, ${escapeSQL(contact_person)}, ${escapeSQL(contact_phone)}, ${escapeSQL(access_code)}, ${escapeSQL(created_at)}) ON CONFLICT (name) DO NOTHING;\n`;
        count++;
    }

    console.log(`✓ Processed ${count} companies`);
    return sql;
}

function processMonthlyReports() {
    const content = fs.readFileSync(path.join(DB_DIR, 'monthly_reports_rows.csv'), 'utf-8');
    const lines = content.replace(/\r\n/g, '\n').split('\n').filter(l => l.trim());

    let sql = '\n-- Monthly reports data\n';
    let count = 0;

    for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        if (fields.length < 5) continue;

        const [id, company_id, report_month, employees_total, recruited_new, resigned_total, net_growth, shortage_total, shortage_detail, notes, created_at, updated_at] = fields;

        // net_growth is a generated column, we don't insert it
        const shortageJson = shortage_detail || '{}';

        sql += `INSERT INTO monthly_reports (id, company_id, report_month, employees_total, recruited_new, resigned_total, shortage_total, shortage_detail, notes, created_at, updated_at) VALUES (${escapeSQL(id)}, ${escapeSQL(company_id)}, ${escapeSQL(report_month)}, ${employees_total || 0}, ${recruited_new || 0}, ${resigned_total || 0}, ${shortage_total || 0}, ${escapeSQL(shortageJson)}::jsonb, ${escapeSQL(notes)}, ${escapeSQL(created_at)}, ${escapeSQL(updated_at)}) ON CONFLICT (company_id, report_month) DO NOTHING;\n`;
        count++;
    }

    console.log(`✓ Processed ${count} monthly reports`);
    return sql;
}

// Main
console.log('Converting CSV to SQL...\n');

let sql = '-- Auto-generated from Supabase CSV export\n';
sql += '-- Generated at: ' + new Date().toISOString() + '\n\n';
sql += 'BEGIN;\n\n';
sql += processCompanies();
sql += processMonthlyReports();
sql += '\nCOMMIT;\n';

fs.writeFileSync(OUTPUT_FILE, sql, 'utf-8');
const sizeMB = (fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(1);
console.log(`\n✓ Output: ${OUTPUT_FILE} (${sizeMB} MB)`);
