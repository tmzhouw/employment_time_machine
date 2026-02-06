import { supabaseAdmin } from '../lib/supabase-admin';

async function main() {
    console.log('--- Checking Companies Table ---');
    const { data: companies, error } = await supabaseAdmin
        .from('companies')
        .select('id, name, industry, town')
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${companies?.length || 0} companies`);
    if (companies && companies.length > 0) {
        console.log('\nSample companies:');
        companies.forEach((c, i) => {
            console.log(`${i + 1}. ${c.name}`);
            console.log(`   Industry: ${c.industry || 'NULL'}`);
            console.log(`   Town: ${c.town || 'NULL'}`);
        });
    }

    // Check industry/town distribution
    const { data: allCompanies } = await supabaseAdmin
        .from('companies')
        .select('industry, town');

    if (allCompanies) {
        const industries = new Set(allCompanies.map(c => c.industry).filter(Boolean));
        const towns = new Set(allCompanies.map(c => c.town).filter(Boolean));

        console.log(`\nUnique industries: ${industries.size}`);
        console.log('Industries:', Array.from(industries));

        console.log(`\nUnique towns: ${towns.size}`);
        console.log('Towns:', Array.from(towns));

        const nullIndustry = allCompanies.filter(c => !c.industry).length;
        const nullTown = allCompanies.filter(c => !c.town).length;

        console.log(`\nCompanies with NULL industry: ${nullIndustry}/${allCompanies.length}`);
        console.log(`Companies with NULL town: ${nullTown}/${allCompanies.length}`);
    }
}

main().catch(console.error).finally(() => process.exit(0));
