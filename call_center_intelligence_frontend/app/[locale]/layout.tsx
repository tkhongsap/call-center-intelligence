import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { FilterProvider } from '@/contexts/FilterContext';
import { DemoModeProvider } from '@/contexts/DemoModeContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { locales, type Locale } from '@/src/i18n';
import '../globals.css';

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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <FilterProvider>
              <DemoModeProvider>
                <RealtimeProvider>
                  <div className="flex min-h-screen bg-surface">
                    <MobileNav />
                    <Sidebar />
                    <main className="flex-1 flex flex-col lg:ml-0 pb-16 lg:pb-0">
                      {children}
                    </main>
                    <ChatDrawer />
                    <MobileBottomNav />
                    <ScrollToTop bottomOffset={80} className="lg:bottom-6" />
                  </div>
                </RealtimeProvider>
              </DemoModeProvider>
            </FilterProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
