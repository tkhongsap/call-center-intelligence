'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Home,
  AlertTriangle,
  FileText,
  Upload,
  Inbox,
  Search,
  Settings,
  BarChart3,
  Bell,
  MoreHorizontal,
  Sun,
  Moon,
  TrendingUp,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useTheme } from '@/contexts/ThemeContext';

const navigationItems = [
  { key: 'home', href: '/home', icon: Home },
  { key: 'alerts', href: '/alerts', icon: AlertTriangle },
  { key: 'cases', href: '/cases', icon: FileText },
  { key: 'trending', href: '/trending', icon: TrendingUp },
  { key: 'uploads', href: '/uploads', icon: Upload },
  { key: 'inbox', href: '/inbox', icon: Inbox },
  { key: 'search', href: '/search', icon: Search },
];

const secondaryNavigationItems = [
  { key: 'analytics', href: '/analytics', icon: BarChart3 },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('navigation');
  const tBrand = useTranslations('brand');
  const tHeader = useTranslations('header');
  const { resolvedTheme, toggleTheme, mounted } = useTheme();

  // Helper to create locale-aware hrefs
  const getLocalizedHref = (href: string) => `/${locale}${href}`;

  // Check if path is active (accounting for locale prefix)
  const isPathActive = (href: string) => {
    const localizedHref = getLocalizedHref(href);
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-default h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-10 h-10 rounded-full bg-[var(--twitter-blue)] flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-primary">{tBrand('title')}</h1>
          <p className="text-xs text-secondary">{tBrand('subtitle')}</p>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = isPathActive(item.href);
            return (
              <li key={item.key}>
                <Link
                  href={getLocalizedHref(item.href)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors twitter-focus-ring ${
                    isActive
                      ? 'font-bold text-primary'
                      : 'font-medium text-primary hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-3 mx-4 border-t border-default" />

        {/* Secondary Navigation */}
        <ul className="space-y-1">
          {secondaryNavigationItems.map((item) => {
            const isActive = isPathActive(item.href);
            return (
              <li key={item.key}>
                <Link
                  href={getLocalizedHref(item.href)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors twitter-focus-ring ${
                    isActive
                      ? 'font-bold text-primary'
                      : 'font-medium text-primary hover:bg-[var(--background-secondary)]'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* New Alert Button - Twitter Compose Style */}
        <div className="mt-4 px-2">
          <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[var(--twitter-blue)] hover:bg-[var(--twitter-blue-hover)] text-white font-bold rounded-full transition-colors shadow-md twitter-focus-ring-light">
            <Bell className="w-5 h-5" />
            <span>{tHeader('newAlert')}</span>
          </button>
        </div>
      </nav>

      {/* User/Role Section */}
      <div className="px-2 py-3 mt-auto border-t border-default">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors twitter-focus-ring">
          <Avatar
            variant="user"
            initials="JW"
            size="md"
            bgColor="bg-[var(--twitter-blue)]"
          />
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-primary truncate">James Wilson</p>
            <p className="text-sm text-secondary truncate">@admin · PM</p>
          </div>
          <MoreHorizontal className="w-5 h-5 text-secondary" />
        </button>
      </div>
    </aside>
  );
}
