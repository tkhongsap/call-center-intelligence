'use client';

import { useLayoutEffect, useState, useCallback, useRef } from 'react';
import { Bell, MessageSquare, User, ChevronDown } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { DemoModeToggle } from '@/components/realtime/DemoModeToggle';
import { SSEToggle } from '@/components/realtime/SSEToggle';
import { usePolling, POLLING_INTERVALS } from '@/hooks/usePolling';
import Link from 'next/link';

interface AlertCount {
  total: number;
  critical: number;
  high: number;
}

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [alertCount, setAlertCount] = useState<AlertCount>({ total: 0, critical: 0, high: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef<number>(0);

  const fetchAlertCount = useCallback(async () => {
    const response = await fetch('/api/alerts/count');
    if (response.ok) {
      const data = await response.json();
      setAlertCount(data);
    }
  }, []);

  // Poll for alert counts
  usePolling(fetchAlertCount, {
    interval: POLLING_INTERVALS.alerts,
    immediate: true,
  });

  // Trigger animation when count changes
  useLayoutEffect(() => {
    if (alertCount.total !== prevCountRef.current && prevCountRef.current !== 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Animation trigger is a legitimate pattern for visual feedback
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = alertCount.total;
  }, [alertCount.total]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      {/* Page Title */}
      <div>
        {title && <h1 className="text-xl font-semibold text-slate-900">{title}</h1>}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* SSE Toggle */}
        <SSEToggle compact />

        {/* Demo Mode Toggle */}
        <DemoModeToggle compact />

        {/* Search */}
        <SearchBar className="w-72" />

        {/* Notifications/Alerts */}
        <Link
          href="/alerts"
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Bell className={`w-5 h-5 ${isAnimating ? 'animate-wiggle' : ''}`} />
          {alertCount.total > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full flex items-center justify-center transition-transform ${
                alertCount.critical > 0 ? 'bg-red-500' : alertCount.high > 0 ? 'bg-orange-500' : 'bg-slate-500'
              } ${isAnimating ? 'scale-125' : 'scale-100'}`}
            >
              {alertCount.total > 99 ? '99+' : alertCount.total}
            </span>
          )}
        </Link>

        {/* Messages */}
        <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-sm font-medium text-slate-900">Alex Chen</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
