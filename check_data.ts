
import { getAnomalies, getReportSummary } from './lib/data';

async function checkData() {
    console.log('--- Checking Anomalies ---');
    const anomalies = await getAnomalies();
    console.log('Anomalies count:', anomalies.length);
    console.log('First anomaly:', anomalies[0]);

    console.log('--- Checking Summary ---');
    const summary = await getReportSummary();
    console.log('Summary:', summary);
}

checkData();
