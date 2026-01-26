import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { CaseFilters } from "@/components/cases/CaseFilters";
import { CaseList } from "@/components/cases/CaseList";
import type { Case } from "@/lib/types";

interface SearchParams {
  page?: string;
  limit?: string;
  bu?: string;
  channel?: string;
  category?: string;
  severity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
}

interface CasesResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getCases(searchParams: SearchParams): Promise<CasesResponse> {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/cases?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch cases");
  }

  return response.json();
}

function CasesLoading() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-8">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

async function CasesContent({ searchParams }: { searchParams: SearchParams }) {
  const data = await getCases(searchParams);
  return (
    <>
      <CaseFilters totalCount={data.pagination.total} />
      <CaseList cases={data.cases} pagination={data.pagination} />
    </>
  );
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const t = await getTranslations("pages.cases");

  return (
    <>
      <Header title={t("title")} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <Suspense fallback={<CasesLoading />}>
          <CasesContent searchParams={params} />
        </Suspense>
      </div>
    </>
  );
}
