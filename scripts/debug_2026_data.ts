import * as XLSX from 'xlsx';
import path from 'path';

const filePath = '/Users/bbxiangqianchong/Desktop/employment_time_machine/data/2026年企业用工招聘详情（1月）.xls';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

console.log('--- First 5 rows ---');
rows.slice(0, 5).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
});
