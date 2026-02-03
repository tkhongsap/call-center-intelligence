'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CaseDetail } from './CaseDetail';
import type { Case } from '@/lib/types';

interface TimelineEvent {
  id: string;
  type: "created" | "assigned" | "contact" | "resolved";
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

export function CaseDetailClient() {
  const params = useParams();
  const id = params.id as string;
  const [caseData, setCaseData] = useState<CaseWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCase() {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/cases/${id}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Case not found');
            return;
          }
          throw new Error(`Failed to fetch case: ${response.status}`);
        }

        const data = await response.json();

        // Add mock timeline and AI summary
        const caseWithExtras: CaseWithExtras = {
          ...data,
          timeline: [
            {
              id: '1',
              type: 'created',
              title: 'Case Created',
              description: 'Case was created in the system',
              timestamp: data.created_at,
            },
            ...(data.assigned_to ? [{
              id: '2',
              type: 'assigned' as const,
              title: 'Case Assigned',
              description: `Assigned to ${data.assigned_to}`,
              timestamp: data.created_at,
            }] : []),
            ...(data.resolved_at ? [{
              id: '3',
              type: 'resolved' as const,
              title: 'Case Resolved',
              description: 'Case was resolved',
              timestamp: data.resolved_at,
            }] : []),
          ],
          aiSummary: {
            whatHappened: data.summary || data.incident_data?.details || 'No details available',
            impact: `${data.severity} severity case affecting ${data.business_unit}`,
            suggestedAction: data.incident_data?.solution || 'Review case details and take appropriate action',
          },
        };

        setCaseData(caseWithExtras);
      } catch (err) {
        console.error('Error fetching case:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch case');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCase();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {error === 'Case not found' ? 'Case Not Found' : 'Error Loading Case'}
        </h2>
        <p className="text-slate-600 mb-4">
          {error || 'Unable to load case details'}
        </p>
        <a
          href="/cases"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Cases
        </a>
      </div>
    );
  }

  return <CaseDetail caseData={caseData} />;
}
