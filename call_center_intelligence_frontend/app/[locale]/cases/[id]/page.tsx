import { Header } from "@/components/layout/Header";
import { CaseDetailClient } from "@/components/cases/CaseDetailClient";

export default async function CaseDetailPage() {
  return (
    <>
      <Header title="Case Details" />
      <div className="flex-1 p-6 overflow-auto">
        <CaseDetailClient />
      </div>
    </>
  );
}
