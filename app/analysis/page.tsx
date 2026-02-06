import { redirect } from 'next/navigation';

export default function AnalysisPage() {
    // Redirect to enterprise tab by default
    redirect('/analysis/enterprise');
}
