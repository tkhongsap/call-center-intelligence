'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Clock,
  Target,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type IconName =
  | 'MessageSquare'
  | 'Clock'
  | 'Target'
  | 'Users'
  | 'TrendingUp'
  | 'Activity'
  | 'CheckCircle';

export interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: IconName;
}

interface MetricsCarouselProps {
  metrics: Metric[];
}

const iconMap: Record<IconName, LucideIcon> = {
  MessageSquare,
  Clock,
  Target,
  Users,
  TrendingUp,
  Activity,
  CheckCircle,
};

export function MetricsCarousel({ metrics }: MetricsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(4);

  // Calculate cards per view based on window size
  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardsPerView(1);
      } else if (width < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(4);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (isHovered) return;

    const maxIndex = Math.ceil(metrics.length / cardsPerView) - 1;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 10000); // Slide every 10 seconds

    return () => clearInterval(interval);
  }, [isHovered, metrics.length, cardsPerView]);

  const maxIndex = Math.ceil(metrics.length / cardsPerView) - 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  return (
    <div
      className="relative w-full overflow-x-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Buttons - only show when there are multiple pages */}
      {maxIndex > 0 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-1.5 transition-all"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-1.5 transition-all"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div className="overflow-hidden px-4">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {metrics.map((metric, index) => {
            const Icon = iconMap[metric.icon];
            return (
              <div
                key={index}
                className="flex-shrink-0 px-0.5"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                <div className="bg-white rounded-xl border border-slate-200 p-3 w-full max-w-[200px] mx-auto box-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <span
                          className={`text-sm font-medium ${
                            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {metric.change}
                        </span>
                        <span className="text-xs text-slate-500">vs last month</span>
                      </div>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        metric.trend === 'up' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicators - only show when there are multiple pages */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-slate-700' : 'w-2 bg-slate-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

