'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/Header';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  BarChart3,
  ArrowRight,
  Maximize,
  Minimize,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface SegmentData {
  segment: number;
  totalIncidents: number;
  resolutionRate: number;
  resolvedCount: number;
  medianResponse: number;
  slaExceptions: number;
  slaCompliance: {
    rate: number;
    withinSLA: number;
    exceptions: number;
  };
  topProvinces: Array<{
    rank: number;
    name: string;
    count: number;
    percentage: number;
  }>;
  categories: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
  complaints: {
    total: number;
    percentage: number;
    resolved: number;
    resolvedPercentage: number;
  };
  wordCloud?: Array<{
    text: string;
    count: number;
  }>;
}

interface RotatingData {
  metadata: {
    totalRows: number;
    segmentSize: number;
    segmentCount: number;
    rotationIntervalHours: number;
    generatedAt: string;
  };
  segments: SegmentData[];
}

// Function to get current segment based on time (rotates every 2 hours)
function getCurrentSegmentIndex(): number {
  const now = new Date();
  const currentHour = now.getHours();
  // Rotate every 2 hours: 0-1→0, 2-3→1, 4-5→2, 6-7→0, ...
  return Math.floor(currentHour / 2) % 3;
}

// Hook to load and manage rotating data
function useRotatingData() {
  const [currentData, setCurrentData] = useState<SegmentData | null>(null);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [allSegments, setAllSegments] = useState<SegmentData[]>([]);

  useEffect(() => {
    // Load data from JSON
    fetch('/data/rotating-data.json')
      .then(res => res.json())
      .then((data: RotatingData) => {
        setAllSegments(data.segments);
        const currentIndex = getCurrentSegmentIndex();
        setSegmentIndex(currentIndex);
        setCurrentData(data.segments[currentIndex]);
      })
      .catch(err => {
        console.error('Failed to load rotating data:', err);
      });

    // Check every minute if we need to switch segment
    const interval = setInterval(() => {
      const newIndex = getCurrentSegmentIndex();
      if (newIndex !== segmentIndex && allSegments.length > 0) {
        setSegmentIndex(newIndex);
        setCurrentData(allSegments[newIndex]);
        console.log(`🔄 Switched to Segment ${newIndex + 1} at ${new Date().toLocaleTimeString()}`);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [segmentIndex, allSegments]);

  return { currentData, segmentIndex };
}

// Hook to fetch word cloud data from API
function useWordCloudData() {
  const [wordCloudData, setWordCloudData] = useState<Array<{ text: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWordCloud = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/incidents/words/ranking?top_n=100`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch word cloud data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Transform API response to match component format
        const transformedWords = data.top_words.map((item: any) => ({
          text: item.word,
          count: item.count
        }));
        
        setWordCloudData(transformedWords);
        setError(null);
      } catch (err) {
        console.error('Error fetching word cloud data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setWordCloudData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWordCloud();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchWordCloud, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return { wordCloudData, isLoading, error };
}

// Page Components
const Page1_Overview = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        MORNING BRIEFING • JANUARY 2026
      </div>
      <h1 className="text-4xl font-semibold text-white mb-12">Monthly Operations Overview</h1>
      <div className="text-8xl font-bold text-white">
        {data.totalIncidents.toLocaleString()}
      </div>
      <div className="text-xl text-slate-400 mt-6">Total Incidents Handled (Last 20 Records)</div>
      <div className="mt-20 grid grid-cols-3 gap-20 text-center">
        <div>
          <div className="text-5xl font-bold text-emerald-500">{data.resolutionRate}%</div>
          <div className="text-slate-500 mt-2 text-sm">Resolution Rate</div>
        </div>
        <div>
          <div className="text-5xl font-bold text-sky-500">{data.medianResponse} hrs</div>
          <div className="text-slate-500 mt-2 text-sm">Median Response</div>
        </div>
        <div>
          <div className="text-5xl font-bold text-amber-500">{data.slaExceptions}</div>
          <div className="text-slate-500 mt-2 text-sm">SLA Exceptions</div>
        </div>
      </div>
    </div>
  );
};

const Page2_RegionalFocus = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-white">Loading...</div>;
  
  const topProvince = data.topProvinces[0];
  const otherProvinces = data.topProvinces.slice(1, 5);
  
  return (
    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        MORNING BRIEFING
      </div>
      <h1 className="text-4xl font-semibold text-white mb-16">Regional Concentration</h1>
      <div className="flex items-center gap-16">
        <div className="text-center">
          <div className="text-8xl font-bold text-white">{topProvince?.count || 0}</div>
          <div className="text-2xl text-slate-300 mt-4">{topProvince?.name || 'N/A'}</div>
          <div className="text-slate-500 mt-2">{topProvince?.percentage || 0}% of segment volume</div>
        </div>
      </div>
      <div className="mt-16 flex gap-4">
        {otherProvinces.map((item, i) => (
          <div key={i} className="bg-slate-700 rounded-lg p-5 text-center min-w-[140px]">
            <div className="text-2xl font-bold text-white">{item.count}</div>
            <div className="text-slate-400 mt-1 text-sm">{item.name}</div>
          </div>
        ))}
      </div>
      <div className="mt-12 bg-slate-700 rounded-lg px-6 py-3 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <span className="text-slate-300 text-sm">
          Data updates every 2 hours
        </span>
      </div>
    </div>
  );
};

const Page3_PeakOperations = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        MORNING BRIEFING
      </div>
      <h1 className="text-4xl font-semibold text-white mb-16">Peak Operations Window</h1>
      <div className="grid grid-cols-2 gap-8 max-w-4xl w-full">
        <div className="bg-slate-800 rounded-xl p-10">
          <div className="flex items-center gap-3 text-slate-400 mb-6">
            <Clock className="w-6 h-6" />
            <span className="text-lg font-medium">High Volume Period</span>
          </div>
          <div className="text-5xl font-bold text-white">10:00–14:00</div>
          <div className="text-slate-500 mt-3">Peak operational hours</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-10">
          <div className="flex items-center gap-3 text-slate-400 mb-6">
            <BarChart3 className="w-6 h-6" />
            <span className="text-lg font-medium">Segment Total</span>
          </div>
          <div className="text-5xl font-bold text-white">{data.totalIncidents}</div>
          <div className="text-slate-500 mt-3">Cases in this segment</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-10">
          <div className="flex items-center gap-3 text-slate-400 mb-6">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg font-medium">Resolution Rate</span>
          </div>
          <div className="text-5xl font-bold text-white">{data.resolutionRate}%</div>
          <div className="text-slate-500 mt-3">Cases successfully closed</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-10">
          <div className="flex items-center gap-3 text-slate-400 mb-6">
            <Wrench className="w-6 h-6" />
            <span className="text-lg font-medium">Top Province</span>
          </div>
          <div className="text-5xl font-bold text-white">{data.topProvinces[0]?.count || 0}</div>
          <div className="text-slate-500 mt-3">{data.topProvinces[0]?.name || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

const Page4_IncidentMix = ({ data }: { data: SegmentData | null }) => {
  if (!data || !data.categories.length) {
    return (
      <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">No Category Data</div>
          <div className="text-slate-400">Loading data...</div>
        </div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.categories.map(c => c.value));
  const colors = ['bg-sky-600', 'bg-emerald-600', 'bg-violet-600', 'bg-rose-600', 'bg-slate-600'];
  
  return (
    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        AFTERNOON REVIEW
      </div>
      <h1 className="text-4xl font-semibold text-white mb-4">Incident Composition</h1>
      <div className="text-slate-500 mb-12">January 2026 Category Distribution</div>
      <div className="flex gap-8 items-end justify-center" style={{ height: '320px' }}>
        {data.categories.slice(0, 5).map((item, i) => {
          // Calculate height in pixels for accurate representation
          const maxHeight = 280; // Maximum bar height in pixels
          const heightPx = Math.max(30, (item.value / maxValue) * maxHeight);
          // Remove numbers at the beginning like "6. " or "2. "
          const cleanLabel = item.label.replace(/^\d+\.\s*/, '');
          // Truncate long labels
          const shortLabel = cleanLabel.length > 30 ? cleanLabel.substring(0, 30) + '...' : cleanLabel;
          return (
            <div key={i} className="flex flex-col items-center gap-4 w-40">
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <div 
                className={`${colors[i % colors.length]} rounded-t-lg w-full shadow-lg transition-all duration-500`} 
                style={{ height: `${heightPx}px` }} 
              />
              <div className="text-sm text-slate-300 text-center truncate w-full px-2 font-medium" title={cleanLabel}>
                {shortLabel}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-12 text-xl">
        <span className="text-white font-bold">{data.categories[0]?.percentage || 0}%</span>
        <span className="text-slate-400"> top category</span>
      </div>
    </div>
  );
};

const Page5_WordCloud = ({ data }: { data: SegmentData | null }) => {
  const { wordCloudData, isLoading, error } = useWordCloudData();
  
  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">Loading Word Cloud...</div>
          <div className="text-slate-400">Fetching top 100 words from incidents</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4 text-rose-500">Error Loading Data</div>
          <div className="text-slate-400">{error}</div>
        </div>
      </div>
    );
  }
  
  if (!wordCloudData || wordCloudData.length === 0) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">No Word Cloud Data</div>
          <div className="text-slate-400">No incident data available</div>
        </div>
      </div>
    );
  }

  // Sort words by count (most frequent first) - display all 100 words
  const sortedWords = [...wordCloudData].sort((a, b) => b.count - a.count);
  
  // Define size classes based on frequency ranking (adjusted for 100 words)
  const getSizeClass = (index: number) => {
    if (index === 0) return 'text-6xl'; // Largest - most frequent
    if (index === 1) return 'text-5xl';
    if (index === 2) return 'text-4xl';
    if (index < 5) return 'text-3xl';
    if (index < 10) return 'text-2xl';
    if (index < 20) return 'text-xl';
    if (index < 40) return 'text-lg';
    if (index < 60) return 'text-base';
    return 'text-sm';
  };

  const getWeightClass = (index: number) => {
    if (index === 0) return 'font-extrabold';
    if (index < 5) return 'font-bold';
    if (index < 20) return 'font-semibold';
    if (index < 50) return 'font-medium';
    return 'font-normal';
  };

  // Vibrant colors - expanded for 100 words
  const colors = [
    'text-violet-500', 'text-pink-500', 'text-yellow-400', 'text-sky-500', 
    'text-orange-500', 'text-blue-600', 'text-amber-400', 'text-rose-500',
    'text-emerald-500', 'text-purple-600', 'text-cyan-500', 'text-lime-500',
    'text-fuchsia-500', 'text-indigo-500', 'text-teal-500', 'text-red-500',
    'text-green-500', 'text-blue-500', 'text-yellow-500', 'text-purple-500'
  ];

  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col text-white p-6 overflow-hidden">
      <div className="text-center mb-4">
        <div className="text-slate-400 text-xs font-medium tracking-wide mb-2">
          AFTERNOON REVIEW
        </div>
        <h1 className="text-3xl font-semibold text-white mb-1">Common Topics</h1>
        <div className="text-slate-500 text-sm">Top 100 frequently mentioned terms in incident reports</div>
      </div>
      
      {/* Word Cloud Container - Scrollable flex wrap layout for 100 words */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4">
          {sortedWords.map((word, index) => (
            <span 
              key={index}
              className={`${getSizeClass(index)} ${getWeightClass(index)} ${colors[index % colors.length]} opacity-90 hover:opacity-100 transition-all cursor-default select-none inline-block px-2 py-1 rounded hover:bg-slate-800`}
              title={`${word.text}: ${word.count} occurrences`}
              style={{
                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}
            >
              {word.text}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="mt-2 text-center text-xs text-slate-500">
        Displaying all 100 words • Sized by frequency • Hover for details
      </div>
    </div>
  );
};

const Page6_EquipmentStatus = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        AFTERNOON REVIEW
      </div>
      <h1 className="text-4xl font-semibold text-white mb-4">Current Analysis</h1>
      <div className="text-slate-500 mb-16">Current Data Snapshot</div>
      <div className="grid grid-cols-3 gap-8">
        <div className="bg-slate-800 rounded-xl p-10 text-center">
          <div className="text-6xl font-bold text-white">{data.totalIncidents}</div>
          <div className="text-xl text-slate-300 mt-3">Total Cases</div>
          <div className="text-slate-500 text-sm">In This Segment</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-10 text-center">
          <div className="text-6xl font-bold text-white">{data.resolvedCount}</div>
          <div className="text-xl text-slate-300 mt-3">Resolved</div>
          <div className="text-slate-500 text-sm">Successfully Closed</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-10 text-center">
          <div className="text-6xl font-bold text-white">{data.slaExceptions}</div>
          <div className="text-xl text-slate-300 mt-3">Pending</div>
          <div className="text-slate-500 text-sm">Awaiting Resolution</div>
        </div>
      </div>
      <div className="mt-12 max-w-xl w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">Resolution Progress</span>
          <span className="text-lg font-bold text-emerald-500">{data.resolutionRate}% resolved</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${data.resolutionRate}%` }} />
        </div>
        <div className="text-center mt-4 text-slate-400 text-sm">
          Data rotates every 2 hours
        </div>
      </div>
    </div>
  );
};

const Page7_TeamPerformance = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-white">Loading...</div>;
  
  const topProvinces = data.topProvinces.slice(0, 3).map((prov, i) => ({
    rank: (i + 1).toString(),
    name: prov.name,
    cases: prov.count,
    percent: prov.percentage
  }));
  
  return (
    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        AFTERNOON REVIEW
      </div>
      <h1 className="text-4xl font-semibold text-white mb-16">Top Provinces Performance</h1>
      <div className="space-y-4 w-full max-w-2xl">
        {topProvinces.map((item, i) => (
          <div key={i} className="bg-slate-700 rounded-xl p-5 flex items-center gap-5">
            <div className="text-3xl font-bold text-slate-500 w-12 text-center">{item.rank}</div>
            <div className="flex-1">
              <div className="text-lg font-medium text-white">{item.name}</div>
              <div className="w-full bg-slate-600 rounded-full h-2 mt-3">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${item.percent}%` }} />
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{item.cases}</div>
              <div className="text-slate-500 text-sm">cases ({item.percent}%)</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-16 text-xl text-slate-300">
        Top 3 provinces handled <span className="text-white font-bold">{topProvinces.reduce((sum, p) => sum + p.percent, 0).toFixed(1)}%</span> of all cases
      </div>
    </div>
  );
};

const Page8_CustomerFeedback = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  
  // Clean category labels - remove numbers at the beginning
  const topCategories = data.categories.slice(0, 4).map((cat, i) => {
    // Remove pattern like "6. " or "2. " at the beginning
    const cleanLabel = cat.label.replace(/^\d+\.\s*/, '');
    return {
      type: cleanLabel,
      count: cat.value
    };
  });
  
  const maxCount = Math.max(...topCategories.map(c => c.count));
  
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        AFTERNOON REVIEW
      </div>
      <h1 className="text-4xl font-semibold text-white mb-12">Customer Feedback</h1>
      <div className="grid grid-cols-2 gap-20 items-center max-w-6xl">
        <div className="text-center">
          <div className="text-8xl font-bold text-white">{data.complaints.total}</div>
          <div className="text-2xl text-slate-300 mt-4">Est. Complaints</div>
          <div className="text-slate-500 mt-2">{data.complaints.percentage}% of total</div>
        </div>
        <div className="space-y-5">
          <div className="text-lg text-slate-400 mb-8 font-medium">Top Categories</div>
          {topCategories.map((item, i) => {
            // Truncate long text
            const displayText = item.type.length > 35 ? item.type.substring(0, 35) + '...' : item.type;
            return (
              <div key={i} className="flex items-center gap-5">
                <div className="w-56 text-left">
                  <div className="text-base text-slate-200 font-medium truncate" title={item.type}>
                    {displayText}
                  </div>
                </div>
                <div className="flex-1 bg-slate-700 rounded-full h-6 min-w-[200px]">
                  <div className="bg-rose-500 h-6 rounded-full flex items-center justify-end pr-4 transition-all duration-500" style={{ width: `${Math.max((item.count / maxCount) * 100, 15)}%` }}>
                    <span className="text-sm font-bold">{item.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-16 flex gap-6">
        <div className="bg-slate-800 rounded-lg px-8 py-5 text-center">
          <div className="text-3xl font-bold text-emerald-500">{data.complaints.resolvedPercentage}%</div>
          <div className="text-slate-500 text-sm mt-1">Est. Resolved</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-8 py-5 text-center">
          <div className="text-3xl font-bold text-amber-500">{data.complaints.resolved}</div>
          <div className="text-slate-500 text-sm mt-1">Successfully Closed</div>
        </div>
      </div>
    </div>
  );
};

const Page9_MonthlyTrend = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-white">Loading...</div>;
  
  // Simulate province distribution as trend
  const provinceData = data.topProvinces.slice(0, 5).map((prov, i) => ({
    name: prov.name,
    value: prov.count,
    isPeak: i === 0
  }));
  
  const maxValue = Math.max(...provinceData.map(p => p.value));
  
  return (
    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        EVENING SUMMARY
      </div>
      <h1 className="text-4xl font-semibold text-white mb-4">Province Distribution</h1>
      <div className="text-slate-500 mb-16">Top 5 Provinces in Segment</div>
      <div className="flex items-end gap-8 h-48">
        {provinceData.map((p, i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="text-lg font-bold text-white">{p.value}</div>
            {p.isPeak && <div className="text-xs bg-sky-600 text-white px-2 py-0.5 rounded">Top</div>}
            <div className={`w-20 rounded-t-lg ${p.isPeak ? 'bg-sky-600' : 'bg-slate-600'}`} style={{ height: `${(p.value / maxValue) * 160}px` }} />
            <div className={`text-sm ${p.isPeak ? 'text-white font-medium' : 'text-slate-500'} truncate max-w-[80px]`}>{p.name}</div>
          </div>
        ))}
      </div>
      <div className="mt-16 text-center">
        <div className="text-xl">
          <span className="text-white font-bold">{provinceData[0]?.name}</span>
          <span className="text-slate-400"> leads with {provinceData[0]?.value} cases</span>
        </div>
        <div className="text-slate-500 mt-2">Current data snapshot</div>
      </div>
    </div>
  );
};

const Page10_SLAStatus = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  
  const pendingCases = data.complaints.total - data.complaints.resolved;
  
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        EVENING SUMMARY
      </div>
      <h1 className="text-4xl font-semibold text-white mb-16">SLA Compliance</h1>
      <div className="relative w-56 h-56">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="6" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray={`${data.slaCompliance.rate * 2.64} ${100 * 2.64}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-white">{data.slaCompliance.rate}%</div>
          <div className="text-slate-500 text-sm">Compliance</div>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-3 gap-10">
        <div className="text-center">
          <div className="text-4xl font-bold text-emerald-500">{data.slaCompliance.withinSLA}</div>
          <div className="text-slate-500 text-sm mt-1">Within SLA</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-rose-500">{data.slaCompliance.exceptions}</div>
          <div className="text-slate-500 text-sm mt-1">Exceptions</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-amber-500">{pendingCases}</div>
          <div className="text-slate-500 text-sm mt-1">Pending Cases</div>
        </div>
      </div>
      <div className="mt-10 text-lg text-slate-400">
        Only <span className="text-white font-bold">{(100 - data.slaCompliance.rate).toFixed(1)}%</span> of incidents exceeded target response time
      </div>
    </div>
  );
};

const Page11_Priorities = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-white">Loading...</div>;
  
  const topProvince = data.topProvinces[0];
  const topCategory = data.categories[0];
  // Clean category label - remove numbers at the beginning
  const cleanCategoryLabel = topCategory?.label.replace(/^\d+\.\s*/, '') || '';
  
  const priorities = [
    { 
      priority: '1', 
      action: `Focus on ${topProvince?.name || 'Top Province'}`, 
      detail: `${topProvince?.count || 0} incidents (${topProvince?.percentage || 0}%) from this province — evaluate regional support`, 
      tag: 'HIGH', 
      tagColor: 'bg-rose-600' 
    },
    { 
      priority: '2', 
      action: topCategory ? `Address ${cleanCategoryLabel}` : 'Category Review', 
      detail: topCategory ? `${topCategory.value} cases (${topCategory.percentage}%) in this category — prioritize resolution` : 'Review category distribution', 
      tag: 'HIGH', 
      tagColor: 'bg-rose-600' 
    },
    { 
      priority: '3', 
      action: 'Improve Resolution Rate', 
      detail: `Currently at ${data.resolutionRate}% — target 95%+ for optimal performance`, 
      tag: 'MEDIUM', 
      tagColor: 'bg-amber-600' 
    },
    { 
      priority: '4', 
      action: 'SLA Compliance Enhancement', 
      detail: `${data.slaExceptions} exceptions in segment — reduce to maintain service quality`, 
      tag: 'MEDIUM', 
      tagColor: 'bg-amber-600' 
    },
  ];
  
  return (
    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white p-12">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        EVENING SUMMARY
      </div>
      <h1 className="text-4xl font-semibold text-white mb-16">Priority Actions</h1>
      <div className="space-y-4 max-w-3xl w-full">
        {priorities.map((item, i) => (
          <div key={i} className="bg-slate-700 rounded-xl p-6 flex items-center gap-6">
            <div className="text-4xl font-bold text-slate-500">{item.priority}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-white">{item.action}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${item.tagColor}`}>{item.tag}</span>
              </div>
              <div className="text-slate-400 mt-2 text-sm">{item.detail}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AnalyticsPage() {
  const t = useTranslations('pages.analytics');
  const [currentPage, setCurrentPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration] = useState(8000); // 8 seconds auto-slide
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Load rotating data
  const { currentData, segmentIndex } = useRotatingData();
  
  // Load word cloud data from API
  const { wordCloudData } = useWordCloudData();
  
  const pages = [
    Page1_Overview,
    Page2_RegionalFocus,
    Page3_PeakOperations,
    Page4_IncidentMix,
    Page5_WordCloud,
    Page6_EquipmentStatus,
    Page7_TeamPerformance,
    Page8_CustomerFeedback,
    Page9_MonthlyTrend,
    Page10_SLAStatus,
    Page11_Priorities,
  ];

  const changePage = useCallback((newPage: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsTransitioning(false);
    }, 300); // Match transition duration
  }, []);

  useEffect(() => {
    setProgress(0);
    const startTime = Date.now();

    const timer = setTimeout(() => {
      const newPage = (currentPage + 1) % pages.length;
      changePage(newPage);
    }, duration);

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(currentProgress);
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [currentPage, duration, pages.length, changePage]);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { left, width } = currentTarget.getBoundingClientRect();
    const clickX = clientX - left;

    if (clickX < width / 2) {
      // Clicked left half - go to previous
      const newPage = (currentPage - 1 + pages.length) % pages.length;
      changePage(newPage);
    } else {
      // Clicked right half - go to next
      const newPage = (currentPage + 1) % pages.length;
      changePage(newPage);
    }
  };

  const remainingSeconds = Math.ceil((duration * (100 - progress)) / 100 / 1000);
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const PageComponent = pages[currentPage];

  // Fullscreen functionality - target specific element
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      // Silently ignore errors (no popup)
    }
  };

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <>
      {!isFullscreen && <Header title={t('title')} />}
      <div 
        ref={containerRef}
        className="flex-1 w-full overflow-hidden relative bg-slate-900"
      >
        {/* Main Content Area */}
        <div
          className="w-full h-full relative"
          onClick={handleCardClick}
          style={{ cursor: 'default' }}
        >
          <div 
            className={cn(
              "w-full h-full transition-opacity duration-500 ease-in-out",
              isTransitioning ? "opacity-0" : "opacity-100"
            )}
          >
            <PageComponent data={currentData} />
          </div>

          {/* Progress Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  changePage(index);
                }}
                className={cn(
                  'h-2 rounded-full transition-all duration-500 ease-in-out',
                  index === currentPage
                    ? 'w-12 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/70'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Fullscreen Button & Timer */}
          <div className="absolute top-6 right-6 flex items-center gap-4 z-30">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-2.5 text-white hover:bg-slate-800 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>

            {/* Circular Progress Timer */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">Next</span>
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    className="text-white/30"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="text-white transition-all duration-100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{remainingSeconds}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
