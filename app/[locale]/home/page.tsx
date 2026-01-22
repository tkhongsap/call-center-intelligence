import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { HomeContent } from '@/components/feed/HomeContent';

export default async function HomePage() {
  const t = await getTranslations('pages.home');

  return (
    <>
      <Header title={t('title')} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Two-column layout: Feed (70%) + Pulse Sidebar (30%) */}
        <HomeContent />
      </div>
    </>
  );
}
