'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SparklineData } from './Sparkline';
import { SparklineMini } from './Sparkline';
import { WordCloudWord } from './WordCloud';
import { QuickFilters, FilterValues } from './QuickFilters';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  FileText,
  FolderOpen,
  AlertTriangle,
  Activity,
  ChevronRight,
} from 'lucide-react';

interface KPIData {
  value: number | string;
  change?: number;
  changeLabel?: string;
  status: 'green' | 'yellow' | 'red' | 'neutral';
}

interface PulseData {
  kpis: {
    totalCasesToday: KPIData;
    openCases: KPIData;
    criticalUrgent: KPIData;
    resolutionRate: KPIData;
    activeAlerts: KPIData;
  };
}

interface SparklineMetric {
  data: SparklineData[];
  currentValue: number;
}

interface SparklineApiData {
  sparklines: {
    totalCases: SparklineMetric;
    openCases: SparklineMetric;
    criticalCases: SparklineMetric;
    resolvedCases: SparklineMetric;
  };
}

interface WordCloudApiData {
  words: WordCloudWord[];
}

interface PulseSidebarProps {
  filters?: FilterValues;
  onFilterChange?: (filters: FilterValues) => void;
}

// Mock data for Teams to Watch - in production this would come from an API
const teamsToWatch = [
  { name: 'Credit Cards', caseCount: 156, trend: 'up' as const },
  { name: 'Mobile Banking', caseCount: 89, trend: 'up' as const },
  { name: 'Online Banking', caseCount: 67, trend: 'down' as const },
];

export function PulseSidebar({ filters, onFilterChange }: PulseSidebarProps) {
  const router = useRouter();
  const [data, setData] = useState<PulseData | null>(null);
  const [sparklineData, setSparklineData] = useState<SparklineApiData | null>(null);
  const [wordCloudData, setWordCloudData] = useState<WordCloudApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreTrending, setShowMoreTrending] = useState(false);
  const [showMoreTeams, setShowMoreTeams] = useState(false);

  useEffect(() => {
    async function fetchPulseData() {
      try {
        const [pulseResponse, sparklineResponse, wordCloudResponse] = await Promise.all([
          fetch('/api/pulse'),
          fetch('/api/pulse/sparklines'),
          fetch('/api/pulse/wordcloud'),
        ]);

        if (pulseResponse.ok) {
          const pulseData = await pulseResponse.json();
          setData(pulseData);
        }

        if (sparklineResponse.ok) {
          const sparklines = await sparklineResponse.json();
          setSparklineData(sparklines);
        }

        if (wordCloudResponse.ok) {
          const wordCloud = await wordCloudResponse.json();
          setWordCloudData(wordCloud);
        }
      } catch (error) {
        console.error('Failed to fetch pulse data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPulseData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTopicClick = (topic: string) => {
    router.push(`/cases?category=${encodeURIComponent(topic)}`);
  };

  const handleTeamClick = (team: string) => {
    router.push(`/cases?bu=${encodeURIComponent(team)}`);
  };

  // Get trending topics from word cloud data
  const trendingTopics = wordCloudData?.words
    ?.slice(0, showMoreTrending ? 8 : 4)
    .map((word, index) => ({
      category: index < 2 ? 'Trending in Call Center' : 'Customer Issues',
      topic: word.text,
      count: word.count,
    })) || [];

  const displayedTeams = showMoreTeams ? teamsToWatch : teamsToWatch.slice(0, 2);

  if (loading) {
    return (
      <div className="space-y-4 lg:sticky lg:top-20">
        {/* Search skeleton */}
        <div className="bg-[#F5F8FA] rounded-2xl p-4">
          <div className="h-10 bg-white rounded-full animate-pulse" />
        </div>
        {/* What's happening skeleton */}
        <div className="bg-[#F5F8FA] rounded-2xl">
          <div className="px-4 py-3">
            <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="px-4 pb-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  // Helper to get trend icon
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Minus className="w-3 h-3 text-slate-400" />;
  };

  return (
    <div className="space-y-4 lg:sticky lg:top-20">
      {/* Search Box */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#657786]" />
          <input
            type="text"
            placeholder="Search cases"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-[#E1E8ED] rounded-full text-[#14171A] placeholder-[#657786] text-[15px] twitter-input-focus transition-colors hover:bg-[#d6dce1]"
          />
        </div>
      </form>

      {/* What's Happening Section */}
      <div className="bg-[#F5F8FA] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E1E8ED]">
          <h2 className="text-xl font-extrabold text-[#14171A]">What&apos;s happening</h2>
        </div>

        {/* Trending Topics */}
        <div>
          {trendingTopics.map((item, index) => (
            <button
              key={item.topic}
              onClick={() => handleTopicClick(item.topic)}
              className="w-full px-4 py-3 text-left hover:bg-black/[0.03] transition-colors"
            >
              <p className="text-[13px] text-[#657786]">{item.category}</p>
              <p className="font-bold text-[15px] text-[#14171A]">{item.topic}</p>
              <p className="text-[13px] text-[#657786]">{item.count.toLocaleString()} cases</p>
              {index === 0 && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-[#1DA1F2]/10 text-[#1DA1F2] text-xs font-medium rounded-full">
                  Trending
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Show more link */}
        {wordCloudData?.words && wordCloudData.words.length > 4 && (
          <button
            onClick={() => setShowMoreTrending(!showMoreTrending)}
            className="w-full px-4 py-3 text-left text-[15px] text-[#1DA1F2] hover:bg-black/[0.03] transition-colors"
          >
            {showMoreTrending ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Teams to Watch Section */}
      <div className="bg-[#F5F8FA] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E1E8ED]">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#657786]" />
            <h2 className="text-xl font-extrabold text-[#14171A]">Teams to watch</h2>
          </div>
        </div>

        <div>
          {displayedTeams.map((team) => (
            <button
              key={team.name}
              onClick={() => handleTeamClick(team.name)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/[0.03] transition-colors group"
            >
              <div>
                <p className="font-bold text-[15px] text-[#14171A]">{team.name}</p>
                <div className="flex items-center gap-1 text-[13px] text-[#657786]">
                  <TrendIcon trend={team.trend} />
                  <span>{team.caseCount} cases today</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#AAB8C2] group-hover:text-[#657786] transition-colors" />
            </button>
          ))}
        </div>

        {teamsToWatch.length > 2 && (
          <button
            onClick={() => setShowMoreTeams(!showMoreTeams)}
            className="w-full px-4 py-3 text-left text-[15px] text-[#1DA1F2] hover:bg-black/[0.03] transition-colors"
          >
            {showMoreTeams ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Compact KPIs Section */}
      <div className="bg-[#F5F8FA] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E1E8ED]">
          <h2 className="text-xl font-extrabold text-[#14171A]">Today&apos;s metrics</h2>
        </div>

        <div className="divide-y divide-[#E1E8ED]">
          {/* Cases Today */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] text-[#657786]">Cases Today</p>
                <p className="font-bold text-xl text-[#14171A]">{kpis?.totalCasesToday.value ?? 0}</p>
              </div>
            </div>
            {sparklineData?.sparklines?.totalCases && (
              <div className="flex items-center gap-2">
                <SparklineMini
                  data={sparklineData.sparklines.totalCases.data.map(d => d.value)}
                  color="blue"
                  width={50}
                  height={24}
                />
                {kpis?.totalCasesToday.change !== undefined && (
                  <span className={`text-xs font-medium ${kpis.totalCasesToday.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {kpis.totalCasesToday.change > 0 ? '+' : ''}{kpis.totalCasesToday.change}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Open Cases */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[13px] text-[#657786]">Open Cases</p>
                <p className="font-bold text-xl text-[#14171A]">{kpis?.openCases.value ?? 0}</p>
              </div>
            </div>
            {sparklineData?.sparklines?.openCases && (
              <div className="flex items-center gap-2">
                <SparklineMini
                  data={sparklineData.sparklines.openCases.data.map(d => d.value)}
                  color="amber"
                  width={50}
                  height={24}
                />
                {kpis?.openCases.change !== undefined && (
                  <span className={`text-xs font-medium ${kpis.openCases.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {kpis.openCases.change > 0 ? '+' : ''}{kpis.openCases.change}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Critical/Urgent */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-[13px] text-[#657786]">Critical/Urgent</p>
                <p className="font-bold text-xl text-[#14171A]">{kpis?.criticalUrgent.value ?? 0}</p>
              </div>
            </div>
            {sparklineData?.sparklines?.criticalCases && (
              <div className="flex items-center gap-2">
                <SparklineMini
                  data={sparklineData.sparklines.criticalCases.data.map(d => d.value)}
                  color="red"
                  width={50}
                  height={24}
                />
                {kpis?.criticalUrgent.change !== undefined && (
                  <span className={`text-xs font-medium ${kpis.criticalUrgent.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {kpis.criticalUrgent.change > 0 ? '+' : ''}{kpis.criticalUrgent.change}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Resolution Rate */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[13px] text-[#657786]">Resolution Rate</p>
                <p className="font-bold text-xl text-[#14171A]">{kpis?.resolutionRate.value ?? '0%'}</p>
              </div>
            </div>
            {sparklineData?.sparklines?.resolvedCases && (
              <div className="flex items-center gap-2">
                <SparklineMini
                  data={sparklineData.sparklines.resolvedCases.data.map(d => d.value)}
                  color="green"
                  width={50}
                  height={24}
                />
                {kpis?.resolutionRate.change !== undefined && (
                  <span className={`text-xs font-medium ${kpis.resolutionRate.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpis.resolutionRate.change > 0 ? '+' : ''}{kpis.resolutionRate.change}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Filters (optional - only shown if props provided) */}
      {filters && onFilterChange && (
        <div className="bg-[#F5F8FA] rounded-2xl p-4">
          <QuickFilters filters={filters} onFilterChange={onFilterChange} />
        </div>
      )}
    </div>
  );
}
