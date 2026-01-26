'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { locales, type Locale } from '@/src/i18n';

interface LanguageSwitcherProps {
  upwards?: boolean;
}

export function LanguageSwitcher({ upwards = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('language');
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

  const switchLocale = (newLocale: Locale) => {
    // Get the path without the current locale
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    const newPath = `/${newLocale}${pathWithoutLocale || '/home'}`;
    router.push(newPath);
    setIsOpen(false);
  };

  const languageLabels: Record<Locale, string> = {
    en: 'English',
    th: 'ไทย'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-[#E1E8ED]/50 transition-colors twitter-focus-ring"
        aria-label={t('switchLanguage')}
        title={t('switchLanguage')}
      >
        <Globe className="w-5 h-5 text-[#657786]" />
        <span className="text-sm font-medium text-[#14171A]">
          {languageLabels[locale as Locale]}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 w-36 bg-white rounded-xl shadow-lg border border-[#E1E8ED] py-1 z-50 ${
            upwards ? 'bottom-full mb-2' : 'mt-2'
          }`}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-[#E1E8ED]/50 transition-colors ${
                locale === loc ? 'font-bold text-[#1DA1F2]' : 'text-[#14171A]'
              }`}
            >
              {languageLabels[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
