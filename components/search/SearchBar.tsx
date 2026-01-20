'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

const RECENT_SEARCHES_KEY = 'recent-searches';
const MAX_RECENT_SEARCHES = 5;

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  initialQuery?: string;
}

export function SearchBar({ className, placeholder = 'Search cases, alerts...', initialQuery = '' }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = useCallback((searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleRecentClick = (searchQuery: string) => {
    setQuery(searchQuery);
    saveRecentSearch(searchQuery);
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleClearRecent = (searchQuery: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== searchQuery);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearInput = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            'w-full h-9 pl-9 pr-20 rounded-lg bg-slate-100 text-sm text-slate-900 placeholder-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white',
            'transition-all duration-200'
          )}
        />

        {/* Right side: Clear button + Keyboard shortcut hint */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClearInput}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {!isFocused && !query && (
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-slate-400 bg-slate-200 rounded">
              <Command className="w-3 h-3" />
              <span>K</span>
            </kbd>
          )}
        </div>
      </form>

      {/* Recent Searches Dropdown */}
      {showDropdown && recentSearches.length > 0 && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Recent Searches
            </span>
          </div>
          <ul>
            {recentSearches.map((search, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{search}</span>
                  <button
                    type="button"
                    onClick={(e) => handleClearRecent(search, e)}
                    className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-slate-100 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
