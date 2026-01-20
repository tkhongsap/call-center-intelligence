import { Header } from '@/components/layout/Header';
import { HomeContent } from '@/components/feed/HomeContent';

export default function HomePage() {
  return (
    <>
      <Header title="Control Tower" />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Two-column layout: Feed (70%) + Pulse Sidebar (30%) */}
        <HomeContent />
      </div>
    </>
  );
}
