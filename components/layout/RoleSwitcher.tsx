'use client';

import { useState, useEffect, useRef } from 'react';
import { User, ChevronDown, Shield, Building2, Headphones } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type UserRole = 'admin' | 'bu_manager' | 'supervisor';

interface RoleOption {
  value: UserRole;
  labelKey: string;
  icon: typeof User;
  description: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'admin', labelKey: 'admin', icon: Shield, description: 'Full access to all BUs' },
  { value: 'bu_manager', labelKey: 'buManager', icon: Building2, description: 'BU-scoped view' },
  { value: 'supervisor', labelKey: 'supervisor', icon: Headphones, description: 'Operational view' },
];

const STORAGE_KEY = 'selectedRole';

export function useRole(): [UserRole, (role: UserRole) => void] {
  // Initialize with default, then sync with localStorage in useEffect
  const [role, setRoleState] = useState<UserRole>('admin');
  const isInitialized = useRef(false);

  // Sync with localStorage on mount (client-side only)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['admin', 'bu_manager', 'supervisor'].includes(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- Hydration sync from localStorage is a legitimate one-time effect
        setRoleState(stored as UserRole);
      }
    }
  }, []);

  const updateRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  };

  return [role, updateRole];
}

export function RoleSwitcher() {
  const t = useTranslations('roles');
  const [role, setRole] = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRole = ROLE_OPTIONS.find(r => r.value === role) || ROLE_OPTIONS[0];
  const CurrentIcon = currentRole.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[#657786] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors twitter-focus-ring text-sm"
        aria-label="Switch role"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden md:inline font-medium">{t(currentRole.labelKey)}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-[#E1E8ED] py-1 z-50"
          role="listbox"
          aria-label="Select role"
        >
          {ROLE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = option.value === role;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setRole(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-[#F5F8FA] transition-colors ${
                  isSelected ? 'bg-[#E8F5FE]' : ''
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-[#1DA1F2]' : 'text-[#657786]'}`} />
                <div>
                  <div className={`font-medium ${isSelected ? 'text-[#1DA1F2]' : 'text-[#14171A]'}`}>
                    {t(option.labelKey)}
                  </div>
                  <div className="text-xs text-[#657786]">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
