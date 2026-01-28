'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export interface WordCloudWord {
  text: string;
  count: number;
  category?: string;
}

export interface WordCloudProps {
  words: WordCloudWord[];
  maxWords?: number;
  onWordClick?: (word: WordCloudWord) => void;
  className?: string;
}

export function WordCloud({
  words,
  maxWords = 15,
  onWordClick,
  className = '',
}: WordCloudProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sort by count and take top N words
  const topWords = [...words]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxWords);

  if (topWords.length === 0) {
    return (
      <div className={`text-center text-slate-400 py-4 ${className}`}>
        No data available
      </div>
    );
  }

  // Calculate size ranges based on frequency
  const maxCount = topWords[0]?.count || 1;
  const minCount = topWords[topWords.length - 1]?.count || 1;
  const range = maxCount - minCount || 1;

  const getSizeClass = (count: number) => {
    const ratio = (count - minCount) / range;
    if (ratio > 0.8) return 'text-lg font-bold';
    if (ratio > 0.6) return 'text-base font-semibold';
    if (ratio > 0.4) return 'text-sm font-medium';
    if (ratio > 0.2) return 'text-sm';
    return 'text-xs';
  };

  const getColorClass = (count: number) => {
    const ratio = (count - minCount) / range;
    if (ratio > 0.8) return 'text-blue-700 hover:text-blue-800';
    if (ratio > 0.6) return 'text-blue-600 hover:text-blue-700';
    if (ratio > 0.4) return 'text-slate-700 hover:text-slate-800';
    if (ratio > 0.2) return 'text-slate-600 hover:text-slate-700';
    return 'text-slate-500 hover:text-slate-600';
  };

  const handleWordClick = (word: WordCloudWord) => {
    if (onWordClick) {
      onWordClick(word);
      return;
    }
    // Default behavior: navigate to cases filtered by category
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', word.text);
    router.push(`/cases?${params.toString()}`);
  };

  // Shuffle words for visual variety (deterministic based on text)
  const shuffledWords = [...topWords].sort((a, b) => {
    const hashA = a.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hashB = b.text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hashA - hashB;
  });

  return (
    <div className={`flex flex-wrap gap-2 justify-center items-center ${className}`}>
      {shuffledWords.map((word) => (
        <button
          key={word.text}
          onClick={() => handleWordClick(word)}
          className={`
            px-2 py-1 rounded-md transition-all duration-200
            hover:bg-slate-100 active:bg-slate-200
            cursor-pointer whitespace-nowrap
            ${getSizeClass(word.count)}
            ${getColorClass(word.count)}
          `}
          title={`${word.text}: ${word.count} cases`}
        >
          {word.text}
        </button>
      ))}
    </div>
  );
}
