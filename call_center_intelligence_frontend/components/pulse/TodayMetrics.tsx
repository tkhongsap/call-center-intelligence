'use client';

import { useEffect, useState } from 'react';
import { FileText, FolderOpen, AlertTriangle, Activity } from 'lucide-react';

interface MetricsData {
  total_today: number;
  open_cases: number;
  critical_urgent: number;
  closed_cases: number;
  resolution_rate: number;
  timestamp: string;
}

export function TodayMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/metrics/today`);
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#F5F8FA] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E1E8ED]">
          <h2 className="text-xl font-extrabold text-[#14171A]">Today&apos;s metrics</h2>
        </div>
        <div className="divide-y divide-[#E1E8ED]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                <div>
                  <div className="h-3 w-20 bg-slate-200 rounded animate-pulse mb-2" />
                  <div className="h-6 w-12 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F8FA] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E1E8ED]">
        <h2 className="text-xl font-extrabold text-[#14171A]">Today&apos;s metrics</h2>
        <p className="text-xs text-[#657786] mt-0.5">Updates every 30 seconds</p>
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
              <p className="font-bold text-xl text-[#14171A]">{metrics?.total_today ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Open Cases */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[13px] text-[#657786]">Open Cases</p>
              <p className="font-bold text-xl text-[#14171A]">{metrics?.open_cases ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Critical/Urgent */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-[13px] text-[#657786]">Critical/Urgent</p>
              <p className="font-bold text-xl text-[#14171A]">{metrics?.critical_urgent ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[13px] text-[#657786]">Resolution Rate</p>
              <p className="font-bold text-xl text-[#14171A]">{metrics?.resolution_rate ?? 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
