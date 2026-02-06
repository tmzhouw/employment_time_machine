
import {
    getTrendData,
    getIndustryDistribution,
    getReportSummary,
    getTopShortageCompanies,
    getTopRecruitingCompanies,
    getRegionalDistribution,
    getTopTurnoverCompanies,
    getTopGrowthCompanies,
    getCompanyHistory
} from '../lib/data';

async function debugData() {
    try {
        console.log('Testing getTrendData...');
        await getTrendData({});
        console.log('✓ getTrendData passed');

        console.log('Testing getIndustryDistribution...');
        await getIndustryDistribution({});
        console.log('✓ getIndustryDistribution passed');

        console.log('Testing getReportSummary...');
        await getReportSummary({});
        console.log('✓ getReportSummary passed');

        console.log('Testing getTopShortageCompanies...');
        await getTopShortageCompanies(5, {});
        console.log('✓ getTopShortageCompanies passed');

        console.log('Testing getTopRecruitingCompanies...');
        await getTopRecruitingCompanies(5, {});
        console.log('✓ getTopRecruitingCompanies passed');

        console.log('Testing getRegionalDistribution...');
        await getRegionalDistribution({});
        console.log('✓ getRegionalDistribution passed');

        console.log('Testing getTopTurnoverCompanies...');
        await getTopTurnoverCompanies(5, {});
        console.log('✓ getTopTurnoverCompanies passed');

        console.log('Testing getTopGrowthCompanies...');
        await getTopGrowthCompanies(5, {});
        console.log('✓ getTopGrowthCompanies passed');

        console.log('Testing getCompanyHistory (null case)...');
        // This simulates the behavior when no company param is present
        // But page.tsx calls Promise.resolve(null), so let's test a real call just in case
        await getCompanyHistory('Test Company');
        console.log('✓ getCompanyHistory passed');

    } catch (error) {
        console.error('❌ Data fetching failed:', error);
        process.exit(1);
    }
}

debugData();
