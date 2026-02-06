import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('=== Checking Database Content ===\n');

    // Check companies
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('id, name, industry, town')
        .limit(5);

    if (compError) {
        console.error('Error fetching companies:', compError);
        return;
    }

    console.log(`Total companies sampled: ${companies?.length || 0}\n`);
    if (companies && companies.length > 0) {
        console.log('Sample companies:');
        companies.forEach((c, i) => {
            console.log(`  ${i + 1}. ${c.name}`);
            console.log(`     Industry: "${c.industry || 'NULL'}"`);
            console.log(`     Town: "${c.town || 'NULL'}"`);
        });
    }

    // Check distribution of industry/town
    const { data: allCompanies } = await supabase
        .from('companies')
        .select('industry, town');

    if (allCompanies) {
        const industries = allCompanies.map(c => c.industry).filter(Boolean);
        const towns = allCompanies.map(c => c.town).filter(Boolean);

        const uniqueIndustries = new Set(industries);
        const uniqueTowns = new Set(towns);

        console.log(`\n=== Distribution Analysis ===`);
        console.log(`Total companies: ${allCompanies.length}`);
        console.log(`Companies with industry: ${industries.length} (${uniqueIndustries.size} unique)`);
        console.log(`Companies with town: ${towns.length} (${uniqueTowns.size} unique)`);

        if (uniqueIndustries.size > 0) {
            console.log(`\nIndustries: ${Array.from(uniqueIndustries).join(', ')}`);
        }

        if (uniqueTowns.size > 0) {
            console.log(`\nTowns: ${Array.from(uniqueTowns).join(', ')}`);
        }

        const nullIndustry = allCompanies.filter(c => !c.industry).length;
        const nullTown = allCompanies.filter(c => !c.town).length;

        console.log(`\n=== NULL Analysis ===`);
        console.log(`Companies with NULL/empty industry: ${nullIndustry}/${allCompanies.length}`);
        console.log(`Companies with NULL/empty town: ${nullTown}/${allCompanies.length}`);
    }

    // Check a joined query to see format
    console.log(`\n=== Testing Join Query ===`);
    const { data: joinTest, error: joinError } = await supabase
        .from('monthly_reports')
        .select(`
            report_month,
            employees_total,
            companies (name, industry, town)
        `)
        .limit(3);

    if (joinError) {
        console.error('Join error:', joinError);
    } else if (joinTest && joinTest.length > 0) {
        console.log(`Join returned ${joinTest.length} rows`);
        console.log('Sample joined row:');
        console.log(JSON.stringify(joinTest[0], null, 2));
        console.log('\nType of companies field:', Array.isArray(joinTest[0].companies) ? 'ARRAY' : 'OBJECT');
    }
}

main().catch(console.error).finally(() => process.exit(0));
