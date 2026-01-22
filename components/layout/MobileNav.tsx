'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Alerts', href: '/alerts', icon: AlertTriangle },
  { name: 'Cases', href: '/cases', icon: FileText },
  { name: 'Uploads', href: '/uploads', icon: Upload },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Search', href: '/search', icon: Search },
];

const secondaryNavigation = [
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
        aria-label="Open navigation menu"
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
              <h1 className="text-base font-bold text-[#14171A]">Call Center</h1>
              <p className="text-xs text-[#657786]">Intelligence</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-[#E1E8ED]/50 transition-colors twitter-focus-ring"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5 text-[#657786]" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors twitter-focus-ring min-h-[48px]',
                      isActive
                        ? 'font-bold text-[#14171A]'
                        : 'font-medium text-[#14171A] hover:bg-[#E1E8ED]/50'
                    )}
                  >
                    <item.icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div className="my-3 mx-4 border-t border-[#E1E8ED]" />

          {/* Secondary Navigation */}
          <ul className="space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3 rounded-full text-lg transition-colors twitter-focus-ring min-h-[48px]',
                      isActive
                        ? 'font-bold text-[#14171A]'
                        : 'font-medium text-[#14171A] hover:bg-[#E1E8ED]/50'
                    )}
                  >
                    <item.icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* New Alert Button */}
          <div className="mt-4 px-2">
            <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold rounded-full transition-colors shadow-md twitter-focus-ring-light min-h-[48px]">
              <Bell className="w-5 h-5" />
              <span>New Alert</span>
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
