import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { CasesListClient } from "@/components/cases/CasesListClient";

export default async function CasesPage() {
  const t = await getTranslations("pages.cases");

  return (
    <>
      <Header title={t("title")} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <CasesListClient />
      </div>
    </>
  );
}
