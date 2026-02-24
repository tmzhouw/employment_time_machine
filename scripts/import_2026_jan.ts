
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FILE_PATH = '/Users/bbxiangqianchong/Desktop/employment_time_machine/data/2026年企业用工招聘详情（1月）.xls';
const REPORT_MONTH = '2026-01-01';

// Column Mapping (based on debug verification)
const COLUMN_INDICES = {
    name: 1,           // '重点工业企业'
    town: 2,           // '乡镇'
    industry: 3,       // '行业'
    contact_person: 4, // '联系人'
    contact_phone: 5,  // '联系电话'
    employees_total: 6, // '现有\n员工数'
    recruited_new: 10,  // '本月新\n招人数'
    resigned_total: 13, // '本月流\n失人数'
    planned_recruitment: 14, // '计划招\n聘人数'
    shortage_total: 15, // '现急缺员工人数' / '总数'
    shortage_general: 16, // '普工'
    shortage_tech: 17,    // '技工'
    shortage_mgmt: 18,    // '管理\n销售'
};

async function importData() {
    console.log(`\n📄 Processing: ${path.basename(FILE_PATH)}`);
    console.log(`   📅 Target Month: ${REPORT_MONTH}`);

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`❌ File not found: ${FILE_PATH}`);
        return;
    }

    // Read Excel
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    // Data starts at row 3 (0-indexed)
    const dataRows = rows.slice(3);
    console.log(`   Found ${dataRows.length} potential rows.`);

    const companiesToUpsert = [];
    const companiesMap = new Map();

    for (const row of dataRows) {
        const name = row[COLUMN_INDICES.name]?.toString().trim();
        if (!name || name.includes('合计') || name.includes('总计')) continue;

        const company = {
            name: name,
            town: row[COLUMN_INDICES.town]?.toString().trim() || null,
            industry: row[COLUMN_INDICES.industry]?.toString().trim() || null,
            contact_person: row[COLUMN_INDICES.contact_person]?.toString().trim() || null,
            contact_phone: row[COLUMN_INDICES.contact_phone]?.toString().trim() || null,
        };

        // Cache for upsert
        companiesMap.set(name, company);
    }

    const uniqueCompanies = Array.from(companiesMap.values());
    console.log(`   Upserting ${uniqueCompanies.length} companies...`);

    // 1. Upsert Companies
    const { error: companyError } = await supabase
        .from('companies')
        .upsert(uniqueCompanies, { onConflict: 'name' });

    if (companyError) {
        console.error(`❌ Company upsert failed: ${companyError.message}`);
        return;
    }

    // 2. Map names to IDs
    const { data: companies, error: fetchError } = await supabase
        .from('companies')
        .select('id, name');

    if (fetchError || !companies) {
        console.error(`❌ Failed to fetch companies: ${fetchError?.message}`);
        return;
    }

    const nameToId = new Map(companies.map(c => [c.name, c.id]));

    // 3. Prepare Reports
    const reportsMap = new Map();
    for (const row of dataRows) {
        const name = row[COLUMN_INDICES.name]?.toString().trim();
        if (!name || name.includes('合计') || name.includes('总计')) continue;

        const companyId = nameToId.get(name);
        if (!companyId) continue;

        const employees_total = parseInt(row[COLUMN_INDICES.employees_total]) || 0;
        const recruited_new = parseInt(row[COLUMN_INDICES.recruited_new]) || 0;
        const resigned_total = parseInt(row[COLUMN_INDICES.resigned_total]) || 0;
        const planned_recruitment = parseInt(row[COLUMN_INDICES.planned_recruitment]) || 0;
        const shortage_total = parseInt(row[COLUMN_INDICES.shortage_total]) || 0;
        const shortage_general = parseInt(row[COLUMN_INDICES.shortage_general]) || 0;
        const shortage_tech = parseInt(row[COLUMN_INDICES.shortage_tech]) || 0;
        const shortage_mgmt = parseInt(row[COLUMN_INDICES.shortage_mgmt]) || 0;

        reportsMap.set(companyId, {
            company_id: companyId,
            report_month: REPORT_MONTH,
            employees_total,
            recruited_new,
            resigned_total,
            planned_recruitment,
            shortage_total,
            shortage_detail: {
                general: shortage_general,
                tech: shortage_tech,
                management: shortage_mgmt
            },
            salary_general: 0,
            salary_tech: 0,
            salary_mgmt: 0,
            status: 'APPROVED',
            notes: 'Batch imported from 2026-01 Excel'
        });
    }

    const finalReports = Array.from(reportsMap.values());
    console.log(`   Upserting ${finalReports.length} unique reports...`);

    // 4. Upsert Reports
    const { error: reportError } = await supabase
        .from('monthly_reports')
        .upsert(finalReports, { onConflict: 'company_id, report_month' });

    if (reportError) {
        console.error(`❌ Monthly reports upsert failed: ${reportError.message}`);
    } else {
        console.log(`   ✅ Successfully imported ${finalReports.length} reports for ${REPORT_MONTH}`);
    }
}

importData().catch(console.error);
