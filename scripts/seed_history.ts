
import fs from 'fs';
import path from 'path';
import * as glob from 'glob';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env.local");
    console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_DIR = path.join(process.cwd(), 'data');

// Column Mapping
const COLUMN_INDICES = {
    name: 1, // '重点工业企业'
    town: 2, // '乡镇'
    industry: 3, // '行业'
    contact_person: 4, // '联系人'
    contact_phone: 5, // '联系电话'
    employees_total: 6, // '现有\n员工数'
    recruited_new: 10,  // '本月新\n招人数'
    resigned_total: 13, // '本月流\n失人数'
    shortage_total: 15, // '现急缺员工人数' / '总数'
};

interface CompanyData {
    name: string;
    town?: string;
    industry?: string;
    contact_person?: string;
    contact_phone?: string;
}

const BATCH_SIZE = 100;

async function processFile(filePath: string) {
    const filename = path.basename(filePath);
    console.log(`\n📄 Processing: ${filename}`);

    // Extract month
    const monthMatch = filename.match(/(\d+)月/);
    if (!monthMatch) {
        console.warn(`⚠️ Could not extract month from filename: ${filename}`);
        return;
    }
    const month = parseInt(monthMatch[1], 10);
    const year = 2025;
    const reportDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    console.log(`   📅 Date: ${reportDate}`);

    // Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to array of arrays
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    const DATA_START_ROW = 3;
    const dataRows = rows.slice(DATA_START_ROW);
    console.log(`   Processing ${dataRows.length} rows...`);

    const companiesMap = new Map<string, CompanyData>();
    const offsetMap = new Map<string, any>(); // Map name to row data for report building

    // 1. Prepare Company Data
    for (const row of dataRows) {
        const name = row[COLUMN_INDICES.name];
        if (!name || typeof name !== 'string' || name.includes('合计') || name.includes('总计')) continue;

        const cleanName = name.toString().trim();
        if (!cleanName) continue;

        const company: CompanyData = {
            name: cleanName,
            town: row[COLUMN_INDICES.town]?.toString().trim() || null,
            industry: row[COLUMN_INDICES.industry]?.toString().trim() || null,
            contact_person: row[COLUMN_INDICES.contact_person]?.toString().trim() || null,
            contact_phone: row[COLUMN_INDICES.contact_phone]?.toString().trim() || null,
        };

        // Deduplicate companies in memory
        companiesMap.set(cleanName, company);
        offsetMap.set(cleanName, row); // Last writer wins for row data
    }

    const companiesToUpsert = Array.from(companiesMap.values());

    // 2. Batch Upsert Companies
    if (companiesToUpsert.length > 0) {
        const { error: companyError } = await supabase
            .from('companies')
            .upsert(companiesToUpsert, { onConflict: 'name', ignoreDuplicates: false });

        if (companyError) {
            console.error(`❌ Batch company upsert failed: ${companyError.message}`);
            return;
        }
    }

    // 3. Fetch Company IDs (Chunked)
    const names = companiesToUpsert.map(c => c.name);
    const nameToId = new Map<string, string>();
    const CHUNK_SIZE = 50;

    for (let i = 0; i < names.length; i += CHUNK_SIZE) {
        const chunk = names.slice(i, i + CHUNK_SIZE);
        const { data: chunkData, error: mapError } = await supabase
            .from('companies')
            .select('id, name')
            .in('name', chunk);

        if (mapError || !chunkData) {
            console.error(`❌ Failed to fetch company IDs chunk ${i}: ${mapError?.message}`);
            continue;
        }

        chunkData.forEach(c => nameToId.set(c.name, c.id));
    }

    const reportsToUpsert: any[] = [];

    // 4. Build Monthly Reports
    for (const [name, row] of offsetMap.entries()) {
        const companyId = nameToId.get(name);
        if (!companyId) continue;

        const employees_total = parseInt(row[COLUMN_INDICES.employees_total] || '0') || 0;
        const recruited_new = parseInt(row[COLUMN_INDICES.recruited_new] || '0') || 0;
        const resigned_total = parseInt(row[COLUMN_INDICES.resigned_total] || '0') || 0;
        const shortage_total = parseInt(row[COLUMN_INDICES.shortage_total] || '0') || 0;

        reportsToUpsert.push({
            company_id: companyId,
            report_month: reportDate,
            employees_total,
            recruited_new,
            resigned_total,
            shortage_total,
            notes: 'Imported via script'
        });
    }

    // 5. Batch Upsert Reports
    if (reportsToUpsert.length > 0) {
        const { error: reportError } = await supabase
            .from('monthly_reports')
            .upsert(reportsToUpsert, { onConflict: 'company_id, report_month' });

        if (reportError) {
            console.error(`❌ Batch report upsert failed: ${reportError.message}`);
        } else {
            console.log(`   ✅ Processed ${reportsToUpsert.length} reports.`);
        }
    }
}

async function main() {
    const files = glob.sync(path.join(DATA_DIR, '*.xls'));
    const xlsxFiles = glob.sync(path.join(DATA_DIR, '*.xlsx'));
    const allFiles = [...files, ...xlsxFiles];

    if (allFiles.length === 0) {
        console.warn("No .xls/.xlsx files found in data/ directory.");
        return;
    }

    // Sort files by month
    allFiles.sort((a, b) => {
        const getMonth = (f: string) => {
            const m = f.match(/(\d+)月/);
            return m ? parseInt(m[1]) : 0;
        }
        return getMonth(a) - getMonth(b);
    });

    for (const file of allFiles) {
        await processFile(file);
    }
}

main().catch(console.error);
