
import fs from 'fs';
import path from 'path';
import * as glob from 'glob';
import * as XLSX from 'xlsx';
import dotenv from 'dotenv';

const DATA_DIR = path.join(process.cwd(), 'data');

const COLUMN_INDICES = {
    name: 1, // '重点工业企业'
};

async function main() {
    const files = glob.sync(path.join(DATA_DIR, '*.xls'));
    const xlsxFiles = glob.sync(path.join(DATA_DIR, '*.xlsx'));
    const allFiles = [...files, ...xlsxFiles];

    if (allFiles.length === 0) {
        console.warn("No .xls/.xlsx files found.");
        return;
    }

    const globalNames = new Set<string>();
    const fileUniqueCounts = [];

    // To find the "first" occurrence of duplicates
    const firstOccurrenceMap = new Map<string, number>();

    for (const filePath of allFiles) {
        console.log(`\n📄 Analyze: ${path.basename(filePath)}`);
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        const dataRows = rows.slice(3); // Skip header

        const namesInThisFile = new Map<string, number>(); // Name -> Line Number

        dataRows.forEach((row, idx) => {
            const rawName = row[COLUMN_INDICES.name];
            if (!rawName) return;
            const name = rawName.toString().trim();
            const lineNum = idx + 4;

            if (name.includes('合计') || name.includes('总计')) return;

            if (namesInThisFile.has(name)) {
                console.log(`   🚨 DUPLICATE IN FILE at line ${lineNum}: "${name}"`);
                console.log(`      (First appearance at line ${namesInThisFile.get(name)})`);
            } else {
                namesInThisFile.set(name, lineNum);
            }

            globalNames.add(name);
        });

        console.log(`   ✅ Valid unique companies in this file: ${namesInThisFile.size}`);
        fileUniqueCounts.push(namesInThisFile.size);
    }

    console.log(`\n==========================================`);
    console.log(`📊 STATISTICS`);
    console.log(`Total Files Scanned: ${allFiles.length}`);
    console.log(`Global Unique Company Names: ${globalNames.size}`);

    // Track frequency of each name across files
    const nameFileCount = new Map<string, number>();

    for (const filePath of allFiles) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
        const dataRows = rows.slice(3); // Skip header
        const uniqueInFile = new Set<string>();

        dataRows.forEach((row) => {
            const rawName = row[COLUMN_INDICES.name];
            if (!rawName) return;
            const name = rawName.toString().trim();
            if (name.includes('合计') || name.includes('总计')) return;
            uniqueInFile.add(name);
        });

        uniqueInFile.forEach(name => {
            nameFileCount.set(name, (nameFileCount.get(name) || 0) + 1);
        });
    }

    console.log(`\n🔎 ANALYZING NAME CONSISTENCY...`);
    const inconsistentNames = [];
    nameFileCount.forEach((count, name) => {
        if (count < allFiles.length) {
            inconsistentNames.push({ name, count });
        }
    });

    if (inconsistentNames.length > 0) {
        console.log(`Found ${inconsistentNames.length} names that are NOT present in all ${allFiles.length} files:`);
        inconsistentNames.forEach(item => {
            console.log(` - "${item.name}" (Present in ${item.count} files)`);
        });
        console.log(`These variations cause the global database count to increase.`);
    } else {
        console.log(`All companies are consistent across all files.`);
    }

    // Check if any file deviates from the global set (Name changes)
    if (globalNames.size > 291) {
        console.log(`\n⚠️ DISCREPANCY DETECTED: Global Unique (${globalNames.size}) > Per-File Unique (Approx 291)`);
        console.log(`This implies some companies changed names between months.`);

        // Find names that appear in global but NOT in all files (or at least, verify the superset)
        // Actually, simpler: just list all 292 names and see which one is "extra" if we expect 291.
        // We can't easily know which is "correct" but we can list the ones that look similar.
    }
}

main().catch(console.error);
