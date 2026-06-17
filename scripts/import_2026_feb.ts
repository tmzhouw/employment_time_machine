
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

const FILE_PATH = path.join(process.cwd(), 'data', '2026年企业用工招聘详情（2月）.xls');
const REPORT_MONTH = '2026-02-01';

// Column Mapping (February 2026 layout - different from January)
// Row 1: 编号(0), 重点工业企业(1), 乡镇(2), 行业(3), 联系人(4), 联系电话(5),
//         年前员工数(6), 现有员工数(7), [空](8), [空](9), 流失人数(10), [空](11), [空](12),
//         计划招聘人数(13), 现急缺员工人数(14), [空](15), [空](16), [空](17), 备注(18)
// Row 2: ..., ..., ..., ..., ..., ...,
//         ..., 总数(7), 老员工返岗数(8), 新招员工数(9), 总数(10), 1月流失(11), 2月流失(12),
//         ..., 总数(14), 普工(15), 技工(16), 管理销售(17)
const COLUMN_INDICES = {
    name: 1,           // '重点工业企业'
    town: 2,           // '乡镇'
    industry: 3,       // '行业'
    contact_person: 4, // '联系人'
    contact_phone: 5,  // '联系电话'
    employees_total: 7, // '现有员工数' -> '总数'
    recruited_new: 9,   // '新招员工数'
    resigned_total: 10, // '流失人数' -> '总数'
    planned_recruitment: 13, // '计划招\n聘人数'
    shortage_total: 14, // '现急缺员工人数' -> '总数'
    shortage_general: 15, // '普工'
    shortage_tech: 16,    // '技工'
    shortage_mgmt: 17,    // '管理\n销售'
};

async function importData() {
    console.log(`\n📄 Processing: ${path.basename(FILE_PATH)}`);
    console.log(`   📅 Target Month: ${REPORT_MONTH}`);

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`❌ File not found: ${FILE_PATH}`);
        return;
    }

    // Read Excel - first inspect headers to verify column mapping
    const workbook = XLSX.readFile(FILE_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    // Log headers for verification
    console.log('\n   📋 Header rows:');
    for (let i = 0; i < Math.min(3, rows.length); i++) {
        console.log(`   Row ${i}: ${JSON.stringify(rows[i]?.slice(0, 20))}`);
    }

    // Data starts at row 3 (0-indexed)
    const dataRows = rows.slice(3);
    console.log(`\n   Found ${dataRows.length} potential rows.`);

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
            notes: 'Batch imported from 2026-02 Excel'
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
