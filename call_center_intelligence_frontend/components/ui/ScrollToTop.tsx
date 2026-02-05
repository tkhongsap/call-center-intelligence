'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollToTopProps {
  /** Scroll threshold in pixels before showing the button */
  threshold?: number;
  /** Additional CSS classes */
  className?: string;
  /** Bottom offset in pixels (useful when there's a bottom nav) */
  bottomOffset?: number;
}

export function ScrollToTop({
  threshold = 500,
  className,
  bottomOffset = 80,
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  const checkScroll = useCallback(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    setIsVisible(scrollY > threshold);
  }, [threshold]);

  useEffect(() => {
    // Check initial scroll position
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial scroll check is valid on mount
    checkScroll();

    // Add scroll listener with passive flag for performance
    window.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        'fixed right-4 z-40 w-12 h-12 rounded-full',
        'bg-[var(--twitter-blue)] hover:bg-[var(--twitter-blue-hover)]',
        'text-white shadow-lg',
        'flex items-center justify-center',
        'transition-all duration-300 ease-out tap-scale',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--twitter-blue)] focus-visible:ring-offset-2',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
      style={{ bottom: `${bottomOffset}px` }}
      aria-label="Scroll to top"
      aria-hidden={!isVisible}
    >
      <ChevronUp className="w-6 h-6" />
    </button>
  );
}
