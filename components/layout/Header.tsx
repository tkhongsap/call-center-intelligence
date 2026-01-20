'use client';

import { Bell, MessageSquare, User, ChevronDown } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      {/* Page Title */}
      <div>
        {title && <h1 className="text-xl font-semibold text-slate-900">{title}</h1>}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search cases, alerts..."
            className="w-64 h-9 pl-4 pr-4 rounded-lg bg-slate-100 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

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
