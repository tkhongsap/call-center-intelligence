'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  AlertTriangle,
  FileText,
  Upload,
  Inbox,
  Search,
  Settings,
  BarChart3,
} from 'lucide-react';

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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 bg-slate-900 text-white min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Call Center</h1>
          <p className="text-xs text-slate-400">Intelligence</p>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 border-t border-slate-800" />

        {/* Secondary Navigation */}
        <ul className="space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User/Role Section */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="px-3 py-2 rounded-lg bg-slate-800">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm font-medium text-white">PM / Admin</p>
        </div>
      </div>
    </aside>
  );
}
