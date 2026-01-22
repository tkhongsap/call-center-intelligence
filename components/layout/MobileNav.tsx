'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Menu,
  X,
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
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { cn } from '@/lib/utils';

const navigationItems = [
  { key: 'home', href: '/home', icon: Home },
  { key: 'alerts', href: '/alerts', icon: AlertTriangle },
  { key: 'cases', href: '/cases', icon: FileText },
  { key: 'uploads', href: '/uploads', icon: Upload },
  { key: 'inbox', href: '/inbox', icon: Inbox },
  { key: 'search', href: '/search', icon: Search },
];

const secondaryNavigationItems = [
  { key: 'analytics', href: '/analytics', icon: BarChart3 },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('navigation');
  const tBrand = useTranslations('brand');
  const tHeader = useTranslations('header');

  // Helper to create locale-aware hrefs
  const getLocalizedHref = (href: string) => `/${locale}${href}`;

  // Check if path is active (accounting for locale prefix)
  const isPathActive = (href: string) => {
    const localizedHref = getLocalizedHref(href);
    return pathname === localizedHref || pathname.startsWith(`${localizedHref}/`);
  };

  // Close drawer when route changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Closing nav on route change is a valid pattern
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      {/* Hamburger Button - visible only on mobile/tablet */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-full bg-white shadow-md border border-[#E1E8ED] hover:bg-[#E1E8ED]/50 transition-colors twitter-focus-ring"
        aria-label={tHeader('openMenu')}
      >
        <Menu className="w-5 h-5 text-[#14171A]" />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px] bg-white flex flex-col transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E1E8ED]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1DA1F2] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#14171A]">{tBrand('title')}</h1>
              <p className="text-xs text-[#657786]">{tBrand('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-[#E1E8ED]/50 transition-colors twitter-focus-ring"
            aria-label={tHeader('closeMenu')}
          >
            <X className="w-5 h-5 text-[#657786]" />
          </button>
        </div>

        {/* Language Switcher */}
        <div className="px-4 py-2 border-b border-[#E1E8ED]">
          <LanguageSwitcher />
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
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors twitter-focus-ring min-h-[48px]',
                      isActive
                        ? 'font-bold text-[#14171A]'
                        : 'font-medium text-[#14171A] hover:bg-[#E1E8ED]/50'
                    )}
                  >
                    <item.icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div className="my-3 mx-4 border-t border-[#E1E8ED]" />

          {/* Secondary Navigation */}
          <ul className="space-y-1">
            {secondaryNavigationItems.map((item) => {
              const isActive = isPathActive(item.href);
              return (
                <li key={item.key}>
                  <Link
                    href={getLocalizedHref(item.href)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors twitter-focus-ring min-h-[48px]',
                      isActive
                        ? 'font-bold text-[#14171A]'
                        : 'font-medium text-[#14171A] hover:bg-[#E1E8ED]/50'
                    )}
                  >
                    <item.icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                    {t(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* New Alert Button */}
          <div className="mt-4 px-2">
            <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold rounded-full transition-colors shadow-md twitter-focus-ring-light min-h-[48px]">
              <Bell className="w-5 h-5" />
              <span>{tHeader('newAlert')}</span>
            </button>
          </div>
        </nav>

        {/* User/Role Section with safe area padding for iOS */}
        <div className="px-2 py-3 mt-auto border-t border-[#E1E8ED] pb-safe">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-full hover:bg-[#E1E8ED]/50 transition-colors twitter-focus-ring min-h-[48px]">
            <Avatar
              variant="user"
              initials="JW"
              size="md"
              bgColor="bg-[#1DA1F2]"
            />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-[#14171A] truncate">James Wilson</p>
              <p className="text-sm text-[#657786] truncate">@admin · PM</p>
            </div>
            <MoreHorizontal className="w-5 h-5 text-[#657786]" />
          </button>
        </div>
      </aside>
    </>
  );
}
