import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Sidebar } from '@/components/layout/Sidebar';
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
                <Sidebar />
                <main className="flex-1 flex flex-col">
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
