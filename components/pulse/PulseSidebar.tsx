'use client';

import { useEffect, useState } from 'react';
import { KPITile } from './KPITile';
import { Sparkline, SparklineData } from './Sparkline';
import { WordCloud, WordCloudWord } from './WordCloud';
import { QuickFilters, FilterValues } from './QuickFilters';
import { FileText, FolderOpen, AlertTriangle, Activity, Cloud } from 'lucide-react';

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

export function PulseSidebar({ filters, onFilterChange }: PulseSidebarProps) {
  const [data, setData] = useState<PulseData | null>(null);
  const [sparklineData, setSparklineData] = useState<SparklineApiData | null>(null);
  const [wordCloudData, setWordCloudData] = useState<WordCloudApiData | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:sticky lg:top-6">
        <div className="px-4 md:px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Pulse</h2>
          <p className="text-sm text-slate-500">Key metrics at a glance</p>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 lg:sticky lg:top-6">
      <div className="px-4 md:px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Pulse</h2>
        <p className="text-sm text-slate-500">Key metrics at a glance</p>
      </div>
      <div className="p-4 md:p-6 space-y-4">
        {/* KPI Tiles Grid */}
        <div className="grid grid-cols-2 gap-3">
          <KPITile
            title="Cases Today"
            value={kpis?.totalCasesToday.value ?? 0}
            change={kpis?.totalCasesToday.change}
            changeLabel={kpis?.totalCasesToday.changeLabel}
            icon={FileText}
            status={kpis?.totalCasesToday.status ?? 'neutral'}
          />
          <KPITile
            title="Open Cases"
            value={kpis?.openCases.value ?? 0}
            change={kpis?.openCases.change}
            changeLabel={kpis?.openCases.changeLabel}
            icon={FolderOpen}
            status={kpis?.openCases.status ?? 'neutral'}
          />
          <KPITile
            title="Critical/Urgent"
            value={kpis?.criticalUrgent.value ?? 0}
            change={kpis?.criticalUrgent.change}
            changeLabel={kpis?.criticalUrgent.changeLabel}
            icon={AlertTriangle}
            status={kpis?.criticalUrgent.status ?? 'neutral'}
          />
          <KPITile
            title="Resolution Rate"
            value={kpis?.resolutionRate.value ?? '0%'}
            change={kpis?.resolutionRate.change}
            changeLabel={kpis?.resolutionRate.changeLabel}
            icon={Activity}
            status={kpis?.resolutionRate.status ?? 'neutral'}
          />
        </div>

        {/* 7-Day Sparklines */}
        {sparklineData?.sparklines && (
          <div className="space-y-3 pt-2 border-t border-slate-200 mt-4">
            <h3 className="text-sm font-medium text-slate-700">7-Day Trends</h3>
            <div className="grid grid-cols-1 gap-2">
              <Sparkline
                title="Daily Cases"
                data={sparklineData.sparklines.totalCases.data}
                currentValue={sparklineData.sparklines.totalCases.currentValue}
                color="blue"
              />
              <Sparkline
                title="Open Cases"
                data={sparklineData.sparklines.openCases.data}
                currentValue={sparklineData.sparklines.openCases.currentValue}
                color="amber"
              />
              <Sparkline
                title="Critical Cases"
                data={sparklineData.sparklines.criticalCases.data}
                currentValue={sparklineData.sparklines.criticalCases.currentValue}
                color="red"
              />
              <Sparkline
                title="Resolved"
                data={sparklineData.sparklines.resolvedCases.data}
                currentValue={sparklineData.sparklines.resolvedCases.currentValue}
                color="green"
              />
            </div>
          </div>
        )}

        {/* Word Cloud */}
        {wordCloudData?.words && wordCloudData.words.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200 mt-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-medium text-slate-700">Top Categories</h3>
            </div>
            <WordCloud words={wordCloudData.words} maxWords={15} />
          </div>
        )}

        {/* Quick Filters */}
        {filters && onFilterChange && (
          <div className="pt-2 border-t border-slate-200 mt-4">
            <QuickFilters filters={filters} onFilterChange={onFilterChange} />
          </div>
        )}
      </div>
    </div>
  );
}
