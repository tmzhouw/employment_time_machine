
import { getIndustryStats } from '../lib/data';

async function verifyStats() {
    console.log('🔍 Verifying Industry Stats...');
    try {
        const stats = await getIndustryStats();
        console.log(`Found ${stats.length} industries.`);

        const totalShortage = stats.reduce((sum, s) => sum + s.shortageCount, 0);
        console.log(`Total Shortage: ${totalShortage}`);

        const totalGeneral = stats.reduce((sum, s) => sum + (s.talentStructure?.general || 0), 0);
        const totalTech = stats.reduce((sum, s) => sum + (s.talentStructure?.tech || 0), 0);
        const totalMgmt = stats.reduce((sum, s) => sum + (s.talentStructure?.mgmt || 0), 0);

        console.log('Talent Structure Totals:');
        console.log(`- General: ${totalGeneral}`);
        console.log(`- Tech: ${totalTech}`);
        console.log(`- Mgmt: ${totalMgmt}`);

        if (totalShortage > 0 && totalGeneral === 0) {
            console.error('❌ Mismatch! Shortage > 0 but General breakdown is 0.');
        } else {
            console.log('✅ Data mismatch check passed (or both are 0).');
        }

        // Print sample industry
        const sample = stats.find(s => s.shortageCount > 0);
        if (sample) {
            console.log('Sample Industry:', sample.name);
            console.log('Shortage:', sample.shortageCount);
            console.log('Structure:', sample.talentStructure);
        }

    } catch (error) {
        console.error('Verify failed:', error);
    }
}

verifyStats();
