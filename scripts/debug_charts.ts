
import { getIndustryDistribution, getRegionalDistribution } from '../lib/data';

async function main() {
    console.log('--- Checking Industry Distribution ---');
    const industries = await getIndustryDistribution({});
    console.log(`Returned ${industries.length} industries`);
    if (industries.length > 0) {
        console.log('Top 3:', industries.slice(0, 3));
    } else {
        console.log('No industry data found!');
    }

    console.log('\n--- Checking Regional Distribution ---');
    const towns = await getRegionalDistribution({});
    console.log(`Returned ${towns.length} towns`);
    if (towns.length > 0) {
        console.log('Top 3:', towns.slice(0, 3));
    } else {
        console.log('No town data found!');
    }
}

main().catch(console.error);
