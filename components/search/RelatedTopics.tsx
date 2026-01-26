'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

interface TrendingTopic {
  term: string;
  currentCount: number;
  baselineCount: number;
  percentChange: number;
  direction: 'rising' | 'stable' | 'declining';
  trendScore: number;
}

interface RelatedTopicsProps {
  searchQuery: string;
  maxTopics?: number;
}

export function RelatedTopics({ searchQuery, maxTopics = 5 }: RelatedTopicsProps) {
  const t = useTranslations('pages.search');
  const locale = useLocale();
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!searchQuery) {
      setTopics([]);
      setLoading(false);
      return;
    }

    const fetchRelatedTopics = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/trending?limit=${maxTopics * 2}`);
        if (response.ok) {
          const data = await response.json();
          const allTopics: TrendingTopic[] = data.topics || [];

          // Filter topics that might be related to the search query
          // Match by checking if any word in the query appears in the topic term
          const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);

          const relatedTopics = allTopics.filter(topic => {
            const topicLower = topic.term.toLowerCase();
            // Check if any query word matches part of the topic
            return queryWords.some(word => topicLower.includes(word)) ||
              // Also include rising topics as potentially relevant
              (topic.direction === 'rising' && topic.trendScore > 5);
          });

          // If no specific matches, show top trending topics
          const topicsToShow = relatedTopics.length > 0
            ? relatedTopics.slice(0, maxTopics)
            : allTopics.filter(t => t.direction === 'rising').slice(0, maxTopics);

          setTopics(topicsToShow);
        }
      } catch (error) {
        console.error('Failed to fetch related topics:', error);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedTopics();
  }, [searchQuery, maxTopics]);

  // Don't render if loading or no topics
  if (loading) {
    return (
      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
          <TrendingUp className="w-4 h-4 text-[#1DA1F2]" />
          {t('relatedTopics')}
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-200">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
        <TrendingUp className="w-4 h-4 text-[#1DA1F2]" />
        {t('relatedTopics')}
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <Link
            key={topic.term}
            href={`/${locale}/trending/${encodeURIComponent(topic.term)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5FE] hover:bg-[#CCE4F7] rounded-full text-sm text-[#1DA1F2] font-medium transition-colors group"
          >
            {topic.term}
            {topic.direction === 'rising' && (
              <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
            )}
            <span className="text-xs text-slate-500 group-hover:text-slate-600">
              {topic.currentCount}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
