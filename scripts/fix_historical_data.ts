
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { glob } from 'glob';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_DIR = path.join(process.cwd(), 'data');

// Default indices for 2025+ format
let COLUMN_INDICES = {
    name: 1,
    planned_recruitment: 14,
    notes: 19
};

// Map filename patterns to report_month strings
function getMonthFromFilename(filename: string): string | null {
    // Pattern 1: 2025年企业用工招聘详情（10月）.xls
    const p1Year = filename.match(/(202[3456])年/);
    const p1Month = filename.match(/（(\d+)月）/);
    if (p1Year && p1Month) {
        return `${p1Year[1]}-${p1Month[1].padStart(2, '0')}-01`;
    }

    // Pattern 2: 2023网络招聘会10-31报表.xls
    const p2Match = filename.match(/(202[3456])网络招聘会(\d+)[-]\d+报表/);
    if (p2Match) {
        return `${p2Match[1]}-${p2Match[2].padStart(2, '0')}-01`;
    }

    return null;
}

async function fixData() {
    console.log('🚀 Starting data recovery from Excel files...');

    // 1. Fetch all companies to map name -> id
    const { data: allCompanies, error: compErr } = await supabase
        .from('companies')
        .select('id, name');

    if (compErr || !allCompanies) {
        console.error('❌ Failed to fetch companies:', compErr);
        return;
    }
    const nameToId = new Map(allCompanies.map(c => [c.name, c.id]));
    console.log(`📊 Cached ${allCompanies.length} companies.`);

    // 2. Find all Excel files recursively
    const files = await glob(path.join(DATA_DIR, '**/202[3456]*.xls'));
    console.log(`📂 Found ${files.length} Excel files to process.`);

    for (const filePath of files) {
        const filename = path.basename(filePath);
        const reportMonth = getMonthFromFilename(filename);

        if (!reportMonth) {
            console.log(`⚠️  Skipping ${filename} (Could not determine month)`);
            continue;
        }

        console.log(`\n📄 Processing ${filename} for ${reportMonth}...`);

        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

        // Detect format from header row (usually row 1)
        const headerRow = rows[1] || [];
        if (headerRow[15] === "收到简历数" || headerRow[21] === "备注") {
            // Old format (2023-2024)
            COLUMN_INDICES = { name: 1, planned_recruitment: 14, notes: 21 };
            // console.log("   Detected OLD format (Index 21 for remarks)");
        } else {
            // New format (2025-2026)
            COLUMN_INDICES = { name: 1, planned_recruitment: 14, notes: 19 };
            // console.log("   Detected NEW format (Index 19 for remarks)");
        }

        // Data starts at row 4 (index 3)
        const dataRows = rows.slice(3);
        let updatedCount = 0;
        let skippedCount = 0;

        const updatePromises = [];
        for (const row of dataRows) {
            const name = row[COLUMN_INDICES.name]?.toString().trim();
            if (!name || name.includes('合计') || name.includes('总计')) continue;

            const companyId = nameToId.get(name);
            if (!companyId) {
                skippedCount++;
                continue;
            }

            const plannedRecruitment = parseInt(row[COLUMN_INDICES.planned_recruitment]) || 0;
            const rawNotes = row[COLUMN_INDICES.notes]?.toString().trim() || null;

            // We only update if there's actual data to restore
            updatePromises.push(
                supabase
                    .from('monthly_reports')
                    .update({
                        planned_recruitment: plannedRecruitment,
                        notes: rawNotes
                    })
                    .eq('company_id', companyId)
                    .eq('report_month', reportMonth)
                    .then(({ error }) => {
                        if (error) console.error(`  ❌ Error updating ${name}:`, error.message);
                        else updatedCount++;
                    })
            );

            // Process in smaller batches of 50 to avoid hitting limits
            if (updatePromises.length >= 50) {
                await Promise.all(updatePromises);
                updatePromises.length = 0;
            }
        }

        // Final batch
        if (updatePromises.length > 0) {
            await Promise.all(updatePromises);
        }

        console.log(`   ✅ Finished ${filename}: ${updatedCount} rows updated, ${skippedCount} companies not found in DB.`);
    }

    console.log('\n🎉 Data recovery complete!');
}

fixData().catch(console.error);
