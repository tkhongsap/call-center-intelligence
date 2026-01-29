import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { AlertDetail } from "@/components/alerts/AlertDetail";
import type { Alert } from "@/lib/types";

interface SampleCase {
  id: string;
  caseNumber: string;
  summary: string;
  severity: string;
  status: string;
  businessUnit: string;
  category: string;
  createdAt: string;
}

interface AlertDetailResponse {
  alert: Alert;
  sampleCases: SampleCase[];
  contributingPhrases: string[];
  timeWindow?: string;
}

async function getAlert(id: string): Promise<AlertDetailResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/alerts/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch alert");
  }

  return response.json();
}

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAlert(id);

  if (!data) {
    notFound();
  }

  return (
    <>
      <Header title="Alert Details" />
      <div className="flex-1 p-6 overflow-auto">
        <AlertDetail
          alert={data.alert}
          sampleCases={data.sampleCases}
          contributingPhrases={data.contributingPhrases}
          timeWindow={data.timeWindow}
        />
      </div>
    </>
  );
}
