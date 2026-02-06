
import path from 'path';
import * as glob from 'glob';
import * as XLSX from 'xlsx';

const DATA_DIR = path.join(process.cwd(), 'data');

async function main() {
    const files = glob.sync(path.join(DATA_DIR, '2025年企业用工招聘详情（12月）.xls'));
    if (files.length === 0) { console.log("File not found"); return; }

    const filePath = files[0];
    console.log(`Reading: ${path.basename(filePath)}`);
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

    // Print first few rows to see headers
    rows.slice(0, 4).forEach((row, idx) => {
        console.log(`Line ${idx + 1}:`, JSON.stringify(row));
    });
}

main();
