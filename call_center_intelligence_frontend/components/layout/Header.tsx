'use client';

import { useLayoutEffect, useState, useCallback, useRef } from 'react';
import { Bell, MessageSquare, ArrowLeft, Settings, Inbox } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { DemoModeToggle } from '@/components/realtime/DemoModeToggle';
import { SSEToggle } from '@/components/realtime/SSEToggle';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { usePolling, POLLING_INTERVALS } from '@/hooks/usePolling';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

interface AlertCount {
  total: number;
  critical: number;
  high: number;
}

interface InboxCount {
  count: number;
  hasEscalations: boolean;
}

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export function Header({ title, showBackButton }: HeaderProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('common');
  const [alertCount, setAlertCount] = useState<AlertCount>({ total: 0, critical: 0, high: 0 });
  const [inboxCount, setInboxCount] = useState<InboxCount>({ count: 0, hasEscalations: false });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isInboxAnimating, setIsInboxAnimating] = useState(false);
  const prevCountRef = useRef<number>(0);
  const prevInboxCountRef = useRef<number>(0);

  // Helper to create locale-aware hrefs
  const getLocalizedHref = (href: string) => `/${locale}${href}`;

  const fetchAlertCount = useCallback(async () => {
    const response = await fetch('/api/alerts/count');
    if (response.ok) {
      const data = await response.json();
      setAlertCount(data);
    }
  }, []);

  const fetchInboxCount = useCallback(async () => {
    const response = await fetch('/api/inbox/count');
    if (response.ok) {
      const data = await response.json();
      setInboxCount(data);
    }
  }, []);

  // Poll for alert counts
  usePolling(fetchAlertCount, {
    interval: POLLING_INTERVALS.alerts,
    immediate: true,
  });

  // Poll for inbox counts
  usePolling(fetchInboxCount, {
    interval: POLLING_INTERVALS.alerts,
    immediate: true,
  });

  // Trigger animation when alert count changes
  useLayoutEffect(() => {
    if (alertCount.total !== prevCountRef.current && prevCountRef.current !== 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Animation trigger is a legitimate pattern for visual feedback
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = alertCount.total;
  }, [alertCount.total]);

  // Trigger animation when inbox count changes
  useLayoutEffect(() => {
    if (inboxCount.count !== prevInboxCountRef.current && prevInboxCountRef.current !== 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Animation trigger is a legitimate pattern for visual feedback
      setIsInboxAnimating(true);
      const timer = setTimeout(() => setIsInboxAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevInboxCountRef.current = inboxCount.count;
  }, [inboxCount.count]);

  return (
    <header className="sticky top-0 z-40 h-14 bg-white/80 backdrop-blur-md border-b border-[#E1E8ED] px-4 flex items-center justify-between">
      {/* Left Section: Back Button (conditional) + Title */}
      {/* Add left padding on mobile for hamburger menu */}
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        {showBackButton && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-[#E1E8ED]/50 transition-colors twitter-focus-ring"
            aria-label={t('back')}
          >
            <ArrowLeft className="w-5 h-5 text-[#14171A]" />
          </button>
        )}
        {title && (
          <h1 className="text-xl font-bold text-[#14171A]">{title}</h1>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Role Switcher - hidden on mobile */}
        <div className="hidden sm:block">
          <RoleSwitcher />
        </div>

        {/* SSE Toggle - hidden on mobile */}
        <div className="hidden sm:block">
          <SSEToggle compact />
        </div>

        {/* Demo Mode Toggle - hidden on mobile */}
        <div className="hidden sm:block">
          <DemoModeToggle compact />
        </div>

        {/* Search - responsive width */}
        <SearchBar className="w-32 sm:w-40 md:w-64" />

        {/* Settings */}
        <Link
          href={getLocalizedHref('/settings')}
          className="p-2 rounded-full text-[#657786] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors twitter-focus-ring"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Inbox */}
        <Link
          href={getLocalizedHref('/inbox')}
          className="relative p-2 rounded-full text-[#657786] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors twitter-focus-ring"
        >
          <Inbox className={`w-5 h-5 ${isInboxAnimating ? 'animate-wiggle' : ''}`} />
          {inboxCount.count > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full flex items-center justify-center transition-transform ${
                inboxCount.hasEscalations ? 'bg-orange-500' : 'bg-[#E0245E]'
              } ${isInboxAnimating ? 'scale-125' : 'scale-100'}`}
            >
              {inboxCount.count > 99 ? '99+' : inboxCount.count}
            </span>
          )}
        </Link>

        {/* Messages */}
        <button className="relative p-2 rounded-full text-[#657786] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors twitter-focus-ring">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1DA1F2] rounded-full" />
        </button>

        {/* Notifications/Alerts - Twitter Style Bell */}
        <Link
          href={getLocalizedHref('/alerts')}
          className="relative p-2 rounded-full text-[#657786] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors twitter-focus-ring"
        >
          <Bell className={`w-5 h-5 ${isAnimating ? 'animate-wiggle' : ''}`} />
          {alertCount.total > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full flex items-center justify-center transition-transform ${
                alertCount.critical > 0 ? 'bg-[#E0245E]' : alertCount.high > 0 ? 'bg-orange-500' : 'bg-[#1DA1F2]'
              } ${isAnimating ? 'scale-125' : 'scale-100'}`}
            >
              {alertCount.total > 99 ? '99+' : alertCount.total}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
