import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { CaseDetail } from '@/components/cases/CaseDetail';
import type { Case } from '@/lib/db/schema';

interface TimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'contact' | 'resolved';
  title: string;
  description: string;
  timestamp: string;
}

interface AISummaryData {
  whatHappened: string;
  impact: string;
  suggestedAction: string;
}

interface CaseWithExtras extends Case {
  timeline: TimelineEvent[];
  aiSummary: AISummaryData;
}

async function getCase(id: string): Promise<CaseWithExtras | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/cases/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch case');
  }

  return response.json();
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseData = await getCase(id);

  if (!caseData) {
    notFound();
  }

  return (
    <>
      <Header title="Case Details" />
      <div className="flex-1 p-6 overflow-auto">
        <CaseDetail caseData={caseData} />
      </div>
    </>
  );
}
