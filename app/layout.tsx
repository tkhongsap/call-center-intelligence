import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { FilterProvider } from '@/contexts/FilterContext';
import { DemoModeProvider } from '@/contexts/DemoModeContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Call Center Intelligence',
  description: 'Control Tower for call center operations with live feed, alerts, and analytics',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FilterProvider>
          <DemoModeProvider>
            <RealtimeProvider>
              <div className="flex min-h-screen bg-slate-50">
                <MobileNav />
                <Sidebar />
                <main className="flex-1 flex flex-col lg:ml-0">
                  {children}
                </main>
                <ChatDrawer />
              </div>
            </RealtimeProvider>
          </DemoModeProvider>
        </FilterProvider>
      </body>
    </html>
  );
}
