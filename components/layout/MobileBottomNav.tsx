'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Home,
  Search,
  AlertTriangle,
  Inbox,
  Menu,
  X,
  FileText,
  Upload,
  Settings,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

// Main bottom nav items (5 tabs)
const bottomNavItems = [
  { key: 'home', href: '/home', icon: Home, filledIcon: Home },
  { key: 'search', href: '/search', icon: Search, filledIcon: Search },
  { key: 'alerts', href: '/alerts', icon: AlertTriangle, filledIcon: AlertTriangle },
  { key: 'inbox', href: '/inbox', icon: Inbox, filledIcon: Inbox },
];

// Menu items for the "More" sheet
const menuItems = [
  { key: 'cases', href: '/cases', icon: FileText },
  { key: 'uploads', href: '/uploads', icon: Upload },
  { key: 'analytics', href: '/analytics', icon: BarChart3 },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function MobileBottomNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('navigation');

  // Helper to create locale-aware hrefs
  const getLocalizedHref = (href: string) => `/${locale}${href}`;

  // Check if path is active (accounting for locale prefix)
  const isPathActive = (href: string) => {
    const localizedHref = getLocalizedHref(href);
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  };

  // Check if any menu item is active
  const isMenuItemActive = menuItems.some((item) => isPathActive(item.href));

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bottom-nav-glassmorphism border-t border-default pb-safe">
        <div className="flex items-center justify-around h-14">
          {bottomNavItems.map((item) => {
            const isActive = isPathActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={getLocalizedHref(item.href)}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full tap-scale',
                  'transition-colors focus:outline-none focus-visible:bg-[var(--twitter-blue-light)]'
                )}
                aria-label={t(item.key)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'w-6 h-6 transition-colors',
                    isActive
                      ? 'text-[var(--twitter-blue)] stroke-[2.5]'
                      : 'text-[var(--foreground-secondary)]'
                  )}
                />
              </Link>
            );
          })}

          {/* Menu button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full tap-scale',
              'transition-colors focus:outline-none focus-visible:bg-[var(--twitter-blue-light)]'
            )}
            aria-label={t('menu')}
            aria-expanded={isMenuOpen}
          >
            <Menu
              className={cn(
                'w-6 h-6 transition-colors',
                isMenuItemActive
                  ? 'text-[var(--twitter-blue)] stroke-[2.5]'
                  : 'text-[var(--foreground-secondary)]'
              )}
            />
          </button>
        </div>
      </nav>

      {/* Menu Bottom Sheet */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 transition-opacity duration-300',
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Sheet */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl transform transition-transform duration-300 ease-out',
            isMenuOpen ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-[var(--foreground-tertiary)]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-default">
            <h2 className="text-lg font-bold text-primary">{t('menu')}</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors tap-scale"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
          </div>

          {/* Language Switcher */}
          <div className="px-4 py-3 border-b border-default">
            <LanguageSwitcher />
          </div>

          {/* Menu Items */}
          <div className="px-2 py-2 max-h-[50vh] overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = isPathActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  href={getLocalizedHref(item.href)}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-4 px-4 py-3 rounded-xl transition-colors tap-scale',
                    isActive
                      ? 'bg-[var(--twitter-blue-light)] text-[var(--twitter-blue)] font-bold'
                      : 'text-primary hover:bg-[var(--background-secondary)]'
                  )}
                >
                  <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                  <span className="text-base">{t(item.key)}</span>
                </Link>
              );
            })}
          </div>

          {/* Safe area padding */}
          <div className="pb-safe" />
        </div>
      </div>
    </>
  );
}
