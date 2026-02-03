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
  pendingCount: number;
  medianResponse: number;
  slaExceptions: number;
  slaCompliance: {
    rate: number;
    withinSLA: number;
    exceptions: number;
    maxSLA: number;
    minSLA: number;
    averageSLA: number;
    zeroSLACount: number;
    totalSLACases: number;
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
  topSubjects: Array<{
    subject: string;
    count: number;
    percentage: number;
  }>;
  topIssueTypes: Array<{
    issueType: string;
    count: number;
    percentage: number;
  }>;
  complaints: {
    total: number;
    percentage: number;
    resolved: number;
    resolvedPercentage: number;
  };
  categorizedCases: {
    total: number;
    resolved: number;
    pending: number;
    resolutionRate: number;
  };
  peakHours?: {
    startHour: number;
    endHour: number;
    count: number;
    timeRange: string;
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

// Function to calculate current offset based on 2-hour rotation
function getCurrentOffset(): number {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const hoursSinceStart = Math.floor((now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60));
  const segmentIndex = Math.floor(hoursSinceStart / 2);
  return segmentIndex * 500;
}

// Function to calculate analytics from incident data
function calculateAnalytics(incidents: any[]): SegmentData {
  const totalIncidents = incidents.length;
  
  // Resolution rate - ถ้า status มีคำว่า "ปิด" นับเป็น resolved, ไม่ใช่นับเป็น pending
  const resolvedIncidents = incidents.filter(inc => {
    const status = inc.status || '';
    return status.includes('ปิด') || status === 'Closed' || status === 'Resolved';
  });
  const resolvedCount = resolvedIncidents.length;
  const pendingCount = totalIncidents - resolvedCount;
  const resolutionRate = totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0;
  
  // Response time (calculate from created_at to updated_at or closed_at)
  const responseTimes: number[] = [];
  incidents.forEach(inc => {
    if (inc.created_at && inc.updated_at) {
      const created = new Date(inc.created_at).getTime();
      const updated = new Date(inc.updated_at).getTime();
      const hours = (updated - created) / (1000 * 60 * 60);
      if (hours >= 0) responseTimes.push(hours);
    }
  });
  const medianResponse = responseTimes.length > 0 
    ? Math.round(responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)])
    : 0;
  
  // SLA compliance - convert string to int and calculate statistics
  const slaValues: number[] = [];
  let zeroSLACount = 0;
  
  incidents.forEach(inc => {
    const slaValue = inc.sla;
    
    // Convert string to int
    if (slaValue !== undefined && slaValue !== null && slaValue !== '') {
      const slaInt = parseInt(String(slaValue), 10);
      
      if (!isNaN(slaInt)) {
        slaValues.push(slaInt);
        if (slaInt === 0) {
          zeroSLACount++;
        }
      }
    }
  });
  
  // Calculate SLA statistics
  let maxSLA = 0;
  let minSLA = 0;
  let averageSLA = 0;
  let withinSLA = 0;
  let exceptions = 0;
  
  if (slaValues.length > 0) {
    maxSLA = Math.max(...slaValues);
    
    // Find minimum SLA that is not zero
    const nonZeroSLAValues = slaValues.filter(sla => sla > 0);
    minSLA = nonZeroSLAValues.length > 0 ? Math.min(...nonZeroSLAValues) : 0;
    
    // Calculate average from non-zero SLA values only
    if (nonZeroSLAValues.length > 0) {
      const totalNonZeroSLA = nonZeroSLAValues.reduce((sum, val) => sum + val, 0);
      averageSLA = Math.round(totalNonZeroSLA / nonZeroSLAValues.length);
    } else {
      averageSLA = 0;
    }
    
    // Assume SLA <= 24 hours is within SLA, > 24 is exception
    withinSLA = slaValues.filter(sla => sla <= 24).length;
    exceptions = slaValues.filter(sla => sla > 24).length;
  }
  
  const totalSLAChecked = withinSLA + exceptions;
  const totalSLACases = slaValues.length;
  const slaRate = totalSLAChecked > 0 ? Math.round((withinSLA / totalSLAChecked) * 100) : 0;
  
  console.log(`📊 SLA Statistics:`, {
    totalSLACases: slaValues.length,
    maxSLA,
    minSLA,
    averageSLA: `${averageSLA} (excl. zero)`,
    zeroSLACount,
    withinSLA,
    exceptions,
    rate: slaRate
  });
  
  // Top provinces
  const provinceCounts: Record<string, number> = {};
  incidents.forEach(inc => {
    const province = inc.province || inc.location || 'Unknown';
    provinceCounts[province] = (provinceCounts[province] || 0) + 1;
  });
  const topProvinces = Object.entries(provinceCounts)
    .map(([name, count]) => ({
      rank: 0,
      name,
      count,
      percentage: Math.round((count / totalIncidents) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  
  // Categories - using issue_subtype_1, excluding null values
  const categoryCounts: Record<string, number> = {};
  incidents.forEach(inc => {
    const category = inc.issue_subtype_1 || inc.category || inc.type;
    // Only count non-null and non-empty values
    if (category && category !== 'null' && category !== '') {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });
  const categories = Object.entries(categoryCounts)
    .map(([label, value]) => ({
      label,
      value,
      percentage: Math.round((value / totalIncidents) * 100)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  
  // Complaints (assuming priority='High' or severity='Critical' are complaints)
  const complaints = incidents.filter(inc => 
    inc.priority === 'High' || inc.priority === 'Critical' || 
    inc.severity === 'High' || inc.severity === 'Critical'
  );
  const complaintTotal = complaints.length;
  // Use same logic: status includes "ปิด" = resolved
  const complaintResolved = complaints.filter(inc => {
    const status = inc.status || '';
    return status.includes('ปิด') || status === 'Closed' || status === 'Resolved';
  }).length;
  
  // Categorized Cases - only count incidents with non-null issue_subtype_1
  const categorizedIncidents = incidents.filter(inc => {
    const category = inc.issue_subtype_1;
    return category && category !== 'null' && category !== '' && category !== null;
  });
  const categorizedTotal = categorizedIncidents.length;
  const categorizedResolved = categorizedIncidents.filter(inc => {
    const status = inc.status || '';
    return status.includes('ปิด') || status === 'Closed' || status === 'Resolved';
  }).length;
  const categorizedPending = categorizedTotal - categorizedResolved;
  const categorizedResolutionRate = categorizedTotal > 0 
    ? Math.round((categorizedResolved / categorizedTotal) * 100) 
    : 0;
  
  // Top Subjects - group by subject field
  const subjectCounts: Record<string, number> = {};
  incidents.forEach(inc => {
    const subject = inc.subject || inc.title || inc.description;
    if (subject && subject !== 'null' && subject !== '' && subject !== null) {
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    }
  });
  const topSubjects = Object.entries(subjectCounts)
    .map(([subject, count]) => ({
      subject,
      count,
      percentage: Math.round((count / totalIncidents) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  // Top Issue Types - group by issue_type field
  const issueTypeCounts: Record<string, number> = {};
  incidents.forEach(inc => {
    const issueType = inc.issue_type || inc.type;
    if (issueType && issueType !== 'null' && issueType !== '' && issueType !== null) {
      issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;
    }
  });
  const topIssueTypes = Object.entries(issueTypeCounts)
    .map(([issueType, count]) => ({
      issueType,
      count,
      percentage: Math.round((count / totalIncidents) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  // Calculate peak hours from created_at
  const hourCounts: Record<number, number> = {};
  incidents.forEach(inc => {
    if (inc.created_at) {
      const date = new Date(inc.created_at);
      const hour = date.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });
  
  // Find the hour with most incidents
  let peakHour = 10; // default
  let maxCount = 0;
  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour);
    }
  });
  
  // Create a 4-hour window around peak hour
  const startHour = peakHour;
  const endHour = (peakHour + 4) % 24;
  const timeRange = `${String(startHour).padStart(2, '0')}:00–${String(endHour).padStart(2, '0')}:00`;
  
  return {
    segment: 0,
    totalIncidents,
    resolutionRate,
    resolvedCount,
    pendingCount,
    medianResponse,
    slaExceptions: exceptions,
    slaCompliance: {
      rate: slaRate,
      withinSLA,
      exceptions,
      maxSLA,
      minSLA,
      averageSLA,
      zeroSLACount,
      totalSLACases
    },
    topProvinces,
    categories,
    topSubjects,
    topIssueTypes,
    complaints: {
      total: complaintTotal,
      percentage: totalIncidents > 0 ? Math.round((complaintTotal / totalIncidents) * 100) : 0,
      resolved: complaintResolved,
      resolvedPercentage: complaintTotal > 0 ? Math.round((complaintResolved / complaintTotal) * 100) : 0
    },
    categorizedCases: {
      total: categorizedTotal,
      resolved: categorizedResolved,
      pending: categorizedPending,
      resolutionRate: categorizedResolutionRate
    },
    peakHours: {
      startHour,
      endHour,
      count: maxCount,
      timeRange
    }
  };
}

// Hook to load and manage rotating API data
function useRotatingData() {
  const [currentData, setCurrentData] = useState<SegmentData | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [wordCloudData, setWordCloudData] = useState<Array<{ text: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load word cloud data once (kept separate from API data)
  useEffect(() => {
    fetch('/data/rotating-data.json')
      .then(res => res.json())
      .then((data: RotatingData) => {
        if (data.segments && data.segments[0] && data.segments[0].wordCloud) {
          setWordCloudData(data.segments[0].wordCloud);
        }
      })
      .catch(err => {
        console.error('Failed to load word cloud data:', err);
      });
  }, []);

  // Fetch data from API - fetch 500 items in 10 batches (API limit is 50 per request)
  const fetchData = useCallback(async (startOffset: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const TARGET_ITEMS = 500;
      const API_LIMIT = 50;
      const numRequests = Math.ceil(TARGET_ITEMS / API_LIMIT); // 10 requests
      
      let allIncidents: any[] = [];
      let totalCountFromAPI = 0;
      
      console.log(`🔄 Fetching ${TARGET_ITEMS} incidents from offset ${startOffset}...`);
      
      // Fetch multiple batches in parallel for faster loading
      const fetchPromises = [];
      for (let i = 0; i < numRequests; i++) {
        const currentOffset = startOffset + (i * API_LIMIT);
        fetchPromises.push(
          fetch(`/api/incidents/?limit=${API_LIMIT}&offset=${currentOffset}`)
            .then(res => {
              if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
              }
              return res.json();
            })
        );
      }
      
      const results = await Promise.all(fetchPromises);
      
      // Combine all results
      results.forEach((data, index) => {
        if (data.count !== undefined && index === 0) {
          totalCountFromAPI = data.count;
        }
        const incidents = data.results || data.incidents || [];
        allIncidents = allIncidents.concat(incidents);
        
        // Debug: log first incident structure
        if (index === 0 && incidents.length > 0) {
          console.log(`🔍 Sample incident structure:`, {
            fields: Object.keys(incidents[0]),
            sample: incidents[0]
          });
        }
      });
      
      if (allIncidents.length === 0) {
        console.warn('⚠️ No incidents returned from API');
        setError('No data available');
      }
      
      // Store total count for pagination loop
      if (totalCountFromAPI > 0) {
        setTotalCount(totalCountFromAPI);
      }
      
      // Calculate analytics from all incidents
      const analytics = calculateAnalytics(allIncidents);
      
      // Add word cloud data
      analytics.wordCloud = wordCloudData;
      
      setCurrentData(analytics);
      setIsLoading(false);
      
      console.log(`📊 Loaded ${allIncidents.length} incidents from offset ${startOffset}`);
      console.log(`📈 Analytics:`, {
        totalIncidents: analytics.totalIncidents,
        resolvedCount: analytics.resolvedCount,
        pendingCount: analytics.pendingCount,
        categorizedCases: analytics.categorizedCases,
        topProvinces: analytics.topProvinces.slice(0, 3),
        topCategories: analytics.categories.slice(0, 3),
        topSubjects: analytics.topSubjects,
        topIssueTypes: analytics.topIssueTypes,
        slaCompliance: analytics.slaCompliance,
        peakHours: analytics.peakHours
      });
    } catch (err) {
      console.error('❌ Failed to fetch API data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setIsLoading(false);
    }
  }, [wordCloudData]);

  // Initial load and rotation logic
  useEffect(() => {
    const offset = getCurrentOffset();
    setCurrentOffset(offset);
    fetchData(offset);

    // Check every minute if we need to fetch new data (2-hour rotation)
    const interval = setInterval(() => {
      const newOffset = getCurrentOffset();
      if (newOffset !== currentOffset) {
        // Calculate looped offset if exceeded total count
        const actualOffset = totalCount > 0 && newOffset >= totalCount 
          ? newOffset % totalCount 
          : newOffset;
        
        setCurrentOffset(actualOffset);
        fetchData(actualOffset);
        console.log(`🔄 Rotated to offset ${actualOffset} at ${new Date().toLocaleTimeString()}`);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [currentOffset, totalCount, fetchData]);

  return { currentData, currentOffset, isLoading, error };
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
      <div className="text-xl text-slate-400 mt-6">Total Incidents Handled (500 Records)</div>
      <div className="mt-20 grid grid-cols-3 gap-20 text-center">
        <div>
          <div className="text-5xl font-bold text-emerald-500">{data.resolutionRate}%</div>
          <div className="text-slate-500 mt-2 text-sm">Resolution Rate</div>
        </div>
        <div>
          <div className="text-5xl font-bold text-sky-500">{data.slaCompliance.averageSLA} hrs</div>
          <div className="text-slate-500 mt-2 text-sm">Average SLA (excl. 0)</div>
        </div>
        <div>
          <div className="text-5xl font-bold text-amber-500">{data.slaCompliance.rate}%</div>
          <div className="text-slate-500 mt-2 text-sm">SLA Compliance</div>
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
  
  // Use calculated peak hours from data
  const peakTimeRange = data.peakHours?.timeRange || '10:00–14:00';
  const peakCount = data.peakHours?.count || 0;
  
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
          <div className="text-5xl font-bold text-white">{peakTimeRange}</div>
          <div className="text-slate-500 mt-3">Peak operational hours ({peakCount} incidents)</div>
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
  if (!data || !data.wordCloud || data.wordCloud.length === 0) {
    return (
      <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">No Word Cloud Data</div>
          <div className="text-slate-400">Loading data...</div>
        </div>
      </div>
    );
  }

  // Sort words by count (most frequent first)
  const sortedWords = [...data.wordCloud].sort((a, b) => b.count - a.count);
  
  // Define size classes based on frequency ranking
  const getSizeClass = (index: number) => {
    if (index === 0) return 'text-8xl'; // Largest - most frequent
    if (index === 1) return 'text-6xl';
    if (index === 2) return 'text-5xl';
    if (index < 5) return 'text-4xl';
    if (index < 8) return 'text-3xl';
    if (index < 12) return 'text-2xl';
    if (index < 16) return 'text-xl';
    return 'text-lg';
  };

  const getWeightClass = (index: number) => {
    if (index === 0) return 'font-extrabold';
    if (index < 3) return 'font-bold';
    if (index < 6) return 'font-semibold';
    return 'font-medium';
  };

  // Vibrant colors like the example
  const colors = [
    'text-violet-500', 'text-pink-500', 'text-yellow-400', 'text-sky-500', 
    'text-orange-500', 'text-blue-600', 'text-amber-400', 'text-rose-500',
    'text-emerald-500', 'text-purple-600', 'text-cyan-500', 'text-lime-500',
    'text-fuchsia-500', 'text-indigo-500', 'text-teal-500'
  ];

  // Slight rotation angles for natural look (in degrees) - more subtle
  const rotations = [
    0, -3, 5, 0, -6, 4, 0, -4, 3, 0, -5, 6, 0, -3, 4, 0, -5, 3, 0, -4, 5, 0, -3
  ];

  // Center word and surrounding words
  const centerWord = sortedWords[0];
  const surroundingWords = sortedWords.slice(1);

  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-8">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-3">
        AFTERNOON REVIEW
      </div>
      <h1 className="text-4xl font-semibold text-white mb-3">Common Topics</h1>
      <div className="text-slate-500 mb-8">Frequently mentioned terms in incident reports</div>
      
      {/* Word Cloud Container - Organized Flex Layout */}
      <div className="flex-1 flex items-center justify-center w-full max-w-7xl px-8">
        <div className="relative w-full">
          {/* Top Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 mb-6">
            {surroundingWords.slice(0, 4).map((word, i) => (
              <span 
                key={i}
                className={`${getSizeClass(i + 1)} ${getWeightClass(i + 1)} ${colors[(i + 1) % colors.length]} opacity-90 hover:opacity-100 transition-all cursor-default select-none inline-block`}
                title={`${word.text} (${word.count})`}
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  transform: `rotate(${rotations[i + 1]}deg)`,
                  margin: '0 8px'
                }}
              >
                {word.text}
              </span>
            ))}
          </div>

          {/* Middle Row with Center Word */}
          <div className="flex items-center justify-center gap-x-8 mb-6">
            {/* Left words */}
            <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 flex-1">
              {surroundingWords.slice(4, 7).map((word, i) => (
                <span 
                  key={i}
                  className={`${getSizeClass(i + 5)} ${getWeightClass(i + 5)} ${colors[(i + 5) % colors.length]} opacity-90 hover:opacity-100 transition-all cursor-default select-none inline-block`}
                  title={`${word.text} (${word.count})`}
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    transform: `rotate(${rotations[i + 5]}deg)`
                  }}
                >
                  {word.text}
                </span>
              ))}
            </div>

            {/* Center Word - Largest */}
            <div className="flex-shrink-0 mx-8">
              <span 
                className={`${getSizeClass(0)} ${getWeightClass(0)} ${colors[0]} opacity-95 hover:opacity-100 transition-all cursor-default select-none inline-block`}
                title={`${centerWord.text} (${centerWord.count})`}
                style={{
                  textShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  transform: 'rotate(0deg)'
                }}
              >
                {centerWord.text}
              </span>
            </div>

            {/* Right words */}
            <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-3 flex-1">
              {surroundingWords.slice(7, 10).map((word, i) => (
                <span 
                  key={i}
                  className={`${getSizeClass(i + 8)} ${getWeightClass(i + 8)} ${colors[(i + 8) % colors.length]} opacity-90 hover:opacity-100 transition-all cursor-default select-none inline-block`}
                  title={`${word.text} (${word.count})`}
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    transform: `rotate(${rotations[i + 8]}deg)`
                  }}
                >
                  {word.text}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            {surroundingWords.slice(10, 15).map((word, i) => (
              <span 
                key={i}
                className={`${getSizeClass(i + 11)} ${getWeightClass(i + 11)} ${colors[(i + 11) % colors.length]} opacity-90 hover:opacity-100 transition-all cursor-default select-none inline-block`}
                title={`${word.text} (${word.count})`}
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  transform: `rotate(${rotations[i + 11]}deg)`,
                  margin: '0 8px'
                }}
              >
                {word.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex gap-8 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-violet-500 rounded" />
          <span className="text-slate-400">Equipment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-pink-500 rounded" />
          <span className="text-slate-400">Products</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded" />
          <span className="text-slate-400">Service</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-sky-500 rounded" />
          <span className="text-slate-400">Operations</span>
        </div>
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
          <div className="text-slate-500 text-sm">Status มี "ปิด"</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-10 text-center">
          <div className="text-6xl font-bold text-white">{data.pendingCount}</div>
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

const Page7_CustomerFeedback = ({ data }: { data: SegmentData | null }) => {
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
          <div className="text-8xl font-bold text-white">{data.categorizedCases.total}</div>
          <div className="text-2xl text-slate-300 mt-4">Total Cases</div>
          <div className="text-slate-500 mt-2">With issue_subtype_1</div>
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
          <div className="text-3xl font-bold text-emerald-500">{data.categorizedCases.resolutionRate}%</div>
          <div className="text-slate-500 text-sm mt-1">Resolved Rate</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-8 py-5 text-center">
          <div className="text-3xl font-bold text-emerald-500">{data.categorizedCases.resolved}</div>
          <div className="text-slate-500 text-sm mt-1">Status มี "ปิด"</div>
        </div>
        <div className="bg-slate-800 rounded-lg px-8 py-5 text-center">
          <div className="text-3xl font-bold text-amber-500">{data.categorizedCases.pending}</div>
          <div className="text-slate-500 text-sm mt-1">Pending</div>
        </div>
      </div>
    </div>
  );
};

const Page8_MonthlyTrend = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-white">Loading...</div>;
  
  const topSubjects = data.topSubjects || [];
  const topIssueTypes = data.topIssueTypes || [];
  
  return (
    <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-white p-8">
      <div className="text-slate-400 text-xs font-medium tracking-wide mb-3">
        EVENING SUMMARY
      </div>
      <h1 className="text-3xl font-semibold text-white mb-8">Top Issues Analysis</h1>
      
      <div className="grid grid-cols-2 gap-10 w-full max-w-5xl">
        {/* Left Side - Top Subjects */}
        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-5 text-center">Top 3 Subjects</h2>
          <div className="space-y-4">
            {topSubjects.map((item, i) => {
              const displaySubject = item.subject.length > 45 ? item.subject.substring(0, 45) + '...' : item.subject;
              return (
                <div key={i} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl font-bold text-sky-500">#{i + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium" title={item.subject}>
                        {displaySubject}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl font-bold text-white">{item.count}</div>
                    <div className="text-slate-400 text-xs">{item.percentage}% of total</div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="bg-sky-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Top Issue Types */}
        <div className="bg-slate-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-5 text-center">Top 3 Issue Types</h2>
          <div className="space-y-4">
            {topIssueTypes.map((item, i) => {
              const displayType = item.issueType.length > 45 ? item.issueType.substring(0, 45) + '...' : item.issueType;
              return (
                <div key={i} className="bg-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl font-bold text-emerald-500">#{i + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium" title={item.issueType}>
                        {displayType}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl font-bold text-white">{item.count}</div>
                    <div className="text-slate-400 text-xs">{item.percentage}% of total</div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-slate-500 text-xs">
        Data from 'subject' and 'issue_type' fields
      </div>
    </div>
  );
};

const Page9_SLAStatus = ({ data }: { data: SegmentData | null }) => {
  if (!data) return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  
  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-white p-8">
      <div className="text-slate-400 text-sm font-medium tracking-wide mb-4">
        EVENING SUMMARY
      </div>
      <h1 className="text-4xl font-semibold text-white mb-10">SLA Statistics</h1>
      
      {/* SLA Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-10 w-full max-w-6xl">
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-sky-500">{data.slaCompliance.maxSLA}</div>
          <div className="text-slate-400 text-sm mt-2">Max SLA (hours)</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-emerald-500">{data.slaCompliance.minSLA}</div>
          <div className="text-slate-400 text-sm mt-2">Min SLA (excl. 0)</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-violet-500">{data.slaCompliance.averageSLA}</div>
          <div className="text-slate-400 text-sm mt-2">Average SLA (hours)</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <div className="text-4xl font-bold text-amber-500">{data.slaCompliance.zeroSLACount}</div>
          <div className="text-slate-400 text-sm mt-2">Zero SLA Cases</div>
        </div>
      </div>
      
      {/* Compliance Rate */}
      <div className="flex items-center gap-16 w-full max-w-6xl">
        <div className="flex-shrink-0">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#334155" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray={`${data.slaCompliance.rate * 2.64} ${100 * 2.64}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-white">{data.slaCompliance.rate}%</div>
              <div className="text-slate-500 text-xs">Compliance</div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-sky-500">{data.slaCompliance.totalSLACases}</div>
            <div className="text-slate-400 mt-2">Total Cases with SLA</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-8 text-center">
            <div className="text-5xl font-bold text-emerald-500">{data.slaCompliance.withinSLA}</div>
            <div className="text-slate-400 mt-2">Within SLA (≤24h)</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-slate-500">
        SLA values converted from string to integer • Average excludes zero values • Threshold: 24 hours
      </div>
    </div>
  );
};

const Page10_Priorities = ({ data }: { data: SegmentData | null }) => {
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
      detail: `Currently at ${data.slaCompliance.rate}% compliance (Avg: ${data.slaCompliance.averageSLA}hrs) — target 95%+ compliance`, 
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
  const { currentData, currentOffset, isLoading, error } = useRotatingData();
  
  const pages = [
    Page1_Overview,
    Page2_RegionalFocus,
    Page3_PeakOperations,
    Page4_IncidentMix,
    Page5_WordCloud,
    Page6_EquipmentStatus,
    Page7_CustomerFeedback,
    Page8_MonthlyTrend,
    Page9_SLAStatus,
    Page10_Priorities,
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
            {error ? (
              <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center p-8">
                  <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                  <div className="text-2xl font-bold mb-2">Error Loading Data</div>
                  <div className="text-slate-400">{error}</div>
                  <div className="mt-6 text-sm text-slate-500">Check console for details</div>
                </div>
              </div>
            ) : (
              <PageComponent data={currentData} />
            )}
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
