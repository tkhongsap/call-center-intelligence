'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Users,
  Clock,
  Target,
  DollarSign,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  XCircle,
  AlertOctagon,
  Info,
} from 'lucide-react';

export type ChartIconName =
  | 'BarChart3'
  | 'TrendingUp'
  | 'PieChart'
  | 'Activity'
  | 'Users'
  | 'Clock'
  | 'Target'
  | 'DollarSign';

export interface Chart {
  title: string;
  icon: ChartIconName;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

interface ChartsCarouselProps {
  charts: Chart[];
}

const iconMap: Record<ChartIconName, LucideIcon> = {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Users,
  Clock,
  Target,
  DollarSign,
};

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  } catch {
    return 'recently';
  }
}

// Mock data for case severity trend
interface SeverityTrendData {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

const generateMockSeverityTrend = (): SeverityTrendData[] => {
  const days = 7;
  const data: SeverityTrendData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      critical: Math.floor(Math.random() * 8) + 2,
      high: Math.floor(Math.random() * 15) + 8,
      medium: Math.floor(Math.random() * 20) + 15,
      low: Math.floor(Math.random() * 18) + 10,
    });
  }
  return data;
};

// Case Status interfaces
interface StatusTrendData {
  date: string;
  in_progress: number;
  open: number;
  resolved: number;
  closed: number;
}

interface CaseStatusData {
  id: string;
  status: 'in_progress' | 'open' | 'resolved' | 'closed';
  title: string;
  timestamp: Date;
}

const generateMockStatusTrend = (): StatusTrendData[] => {
  const days = 7;
  const data: StatusTrendData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      in_progress: Math.floor(Math.random() * 12) + 8,
      open: Math.floor(Math.random() * 15) + 10,
      resolved: Math.floor(Math.random() * 10) + 5,
      closed: Math.floor(Math.random() * 8) + 3,
    });
  }
  return data;
};

const generateMockCaseStatus = (): CaseStatusData[] => {
  const titles = [
    'Customer inquiry about billing',
    'Technical support request',
    'Feature enhancement proposal',
    'Bug report - login issue',
    'Account access problem',
    'Payment verification needed',
    'Service upgrade request',
    'Data export inquiry',
    'Integration setup help',
    'Performance optimization',
  ];

  const mockData: CaseStatusData[] = [];
  const distribution = [
    ...Array(10).fill('in_progress'),
    ...Array(13).fill('open'),
    ...Array(8).fill('resolved'),
    ...Array(5).fill('closed'),
  ] as Array<'in_progress' | 'open' | 'resolved' | 'closed'>;

  for (let i = 0; i < 36; i++) {
    const status = distribution[i];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);

    mockData.push({
      id: `CASE-${String(i + 101).padStart(4, '0')}`,
      status,
      title,
      timestamp,
    });
  }

  return mockData;
};

// Old interface kept for compatibility
interface CaseSeverityData {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  timestamp: Date;
}

const generateMockCaseSeverity = (): CaseSeverityData[] => {
  const titles = [
    'System outage detected',
    'Network connectivity issue',
    'Database performance degradation',
    'API response timeout',
    'Authentication failure',
    'Payment processing error',
    'Data sync issue',
    'Server memory warning',
    'Disk space alert',
    'SSL certificate expiring',
  ];

  const mockData: CaseSeverityData[] = [];
  const distribution = [
    ...Array(5).fill('critical'),
    ...Array(12).fill('high'),
    ...Array(18).fill('medium'),
    ...Array(15).fill('low'),
  ] as Array<'critical' | 'high' | 'medium' | 'low'>;

  for (let i = 0; i < 50; i++) {
    const severity = distribution[i];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);

    mockData.push({
      id: `CASE-${String(i + 1).padStart(4, '0')}`,
      severity,
      title,
      timestamp,
    });
  }

  return mockData;
};

// Negative Trending Issues interface
interface NegativeTrendingIssue {
  id: string;
  category: string;
  negativeCount: number;
  totalCount: number;
  trend: 'up' | 'down';
  percentChange: number;
  topComplaints: string[];
}

const generateMockNegativeTrending = (): NegativeTrendingIssue[] => {
  return [
    {
      id: 'trend-001',
      category: 'Payment Processing Issues',
      negativeCount: 47,
      totalCount: 120,
      trend: 'up',
      percentChange: 23.5,
      topComplaints: ['Transaction failed', 'Delayed refund', 'Double charge']
    },
    {
      id: 'trend-002',
      category: 'App Crashes & Bugs',
      negativeCount: 38,
      totalCount: 95,
      trend: 'up',
      percentChange: 18.2,
      topComplaints: ['App freezes', 'Login error', 'Data not syncing']
    },
    {
      id: 'trend-003',
      category: 'Poor Customer Support',
      negativeCount: 35,
      totalCount: 88,
      trend: 'up',
      percentChange: 15.8,
      topComplaints: ['Long wait time', 'Unhelpful responses', 'No follow-up']
    },
    {
      id: 'trend-004',
      category: 'Delivery Delays',
      negativeCount: 29,
      totalCount: 76,
      trend: 'down',
      percentChange: -5.3,
      topComplaints: ['Late delivery', 'Missing items', 'Wrong address']
    },
    {
      id: 'trend-005',
      category: 'Product Quality Issues',
      negativeCount: 24,
      totalCount: 65,
      trend: 'up',
      percentChange: 12.1,
      topComplaints: ['Damaged goods', 'Not as described', 'Poor packaging']
    },
  ];
};

// Business Unit Critical Cases interface
interface BusinessUnitCriticalCase {
  id: string;
  businessUnit: string;
  criticalCount: number;
  highCount: number;
  totalActive: number;
  inProgressCount: number;
  openCount: number;
  icon: 'briefcase' | 'headphones' | 'code' | 'settings' | 'shopping-cart';
  topCases: {
    id: string;
    title: string;
    severity: 'critical' | 'high';
    status: 'in_progress' | 'open';
  }[];
}

const generateMockBusinessUnitCritical = (): BusinessUnitCriticalCase[] => {
  return [
    {
      id: 'bu-001',
      businessUnit: 'KFC Delivery',
      criticalCount: 12,
      highCount: 23,
      totalActive: 35,
      inProgressCount: 18,
      openCount: 17,
      icon: 'shopping-cart',
      topCases: [
        { id: 'CASE-2401', title: 'Delivery tracking system down', severity: 'critical', status: 'in_progress' },
        { id: 'CASE-2398', title: 'Payment gateway timeout', severity: 'critical', status: 'open' },
        { id: 'CASE-2395', title: 'Order not received by customer', severity: 'high', status: 'in_progress' },
      ]
    },
    {
      id: 'bu-002',
      businessUnit: 'Oishi Restaurants',
      criticalCount: 9,
      highCount: 18,
      totalActive: 27,
      inProgressCount: 15,
      openCount: 12,
      icon: 'briefcase',
      topCases: [
        { id: 'CASE-2410', title: 'POS system failure at multiple locations', severity: 'critical', status: 'in_progress' },
        { id: 'CASE-2407', title: 'Reservation system not working', severity: 'critical', status: 'open' },
        { id: 'CASE-2404', title: 'Menu items showing incorrect prices', severity: 'high', status: 'in_progress' },
      ]
    },
    {
      id: 'bu-003',
      businessUnit: 'Beer & Spirits',
      criticalCount: 7,
      highCount: 14,
      totalActive: 21,
      inProgressCount: 11,
      openCount: 10,
      icon: 'briefcase',
      topCases: [
        { id: 'CASE-2415', title: 'Product recall notification system failed', severity: 'critical', status: 'open' },
        { id: 'CASE-2412', title: 'Inventory discrepancy at warehouse', severity: 'high', status: 'in_progress' },
        { id: 'CASE-2409', title: 'Age verification not working', severity: 'high', status: 'open' },
      ]
    },
    {
      id: 'bu-004',
      businessUnit: 'KFC Loyalty',
      criticalCount: 5,
      highCount: 11,
      totalActive: 16,
      inProgressCount: 9,
      openCount: 7,
      icon: 'code',
      topCases: [
        { id: 'CASE-2420', title: 'Points not credited after purchase', severity: 'critical', status: 'in_progress' },
        { id: 'CASE-2418', title: 'Reward redemption failing', severity: 'high', status: 'open' },
        { id: 'CASE-2416', title: 'Member tier upgrade not reflecting', severity: 'high', status: 'in_progress' },
      ]
    },
    {
      id: 'bu-005',
      businessUnit: 'Oishi Beverages',
      criticalCount: 4,
      highCount: 8,
      totalActive: 12,
      inProgressCount: 6,
      openCount: 6,
      icon: 'headphones',
      topCases: [
        { id: 'CASE-2425', title: 'Product quality complaint - contamination', severity: 'critical', status: 'open' },
        { id: 'CASE-2423', title: 'Batch recall process delayed', severity: 'high', status: 'in_progress' },
        { id: 'CASE-2421', title: 'Distributor supply chain issue', severity: 'high', status: 'open' },
      ]
    },
  ];
};

// Response Time Analysis interfaces
interface ResponseTimeData {
  id: string;
  category: string;
  avgResponseTime: number; // in minutes
  target: number; // target time in minutes
  performance: number; // percentage
  trend: 'up' | 'down' | 'stable';
  color: string;
  recentCases: {
    id: string;
    title: string;
    responseTime: number;
    status: 'fast' | 'normal' | 'slow';
  }[];
}

const generateMockResponseTime = (): ResponseTimeData[] => {
  return [
    {
      id: 'rt-001',
      category: 'Order Issues',
      avgResponseTime: 8,
      target: 15,
      performance: 187,
      trend: 'up',
      color: '#10b981',
      recentCases: [
        { id: 'CASE-2451', title: 'Wrong order delivered', responseTime: 5, status: 'fast' },
        { id: 'CASE-2448', title: 'Missing items in order', responseTime: 7, status: 'fast' },
        { id: 'CASE-2445', title: 'Order cancellation request', responseTime: 12, status: 'normal' },
      ]
    },
    {
      id: 'rt-002',
      category: 'Product Quality',
      avgResponseTime: 12,
      target: 15,
      performance: 125,
      trend: 'up',
      color: '#22c55e',
      recentCases: [
        { id: 'CASE-2450', title: 'Food quality complaint', responseTime: 10, status: 'fast' },
        { id: 'CASE-2447', title: 'Expired product received', responseTime: 8, status: 'fast' },
        { id: 'CASE-2444', title: 'Packaging damaged', responseTime: 18, status: 'normal' },
      ]
    },
    {
      id: 'rt-003',
      category: 'Delivery Problems',
      avgResponseTime: 18,
      target: 20,
      performance: 111,
      trend: 'stable',
      color: '#eab308',
      recentCases: [
        { id: 'CASE-2449', title: 'Delayed delivery', responseTime: 15, status: 'normal' },
        { id: 'CASE-2446', title: 'Wrong address', responseTime: 20, status: 'normal' },
        { id: 'CASE-2443', title: 'Driver not responding', responseTime: 19, status: 'normal' },
      ]
    },
    {
      id: 'rt-004',
      category: 'Payment & Billing',
      avgResponseTime: 28,
      target: 30,
      performance: 107,
      trend: 'down',
      color: '#f59e0b',
      recentCases: [
        { id: 'CASE-2452', title: 'Duplicate charge', responseTime: 25, status: 'normal' },
        { id: 'CASE-2442', title: 'Refund not received', responseTime: 32, status: 'slow' },
        { id: 'CASE-2441', title: 'Payment failed', responseTime: 27, status: 'normal' },
      ]
    },
    {
      id: 'rt-005',
      category: 'App & Technical',
      avgResponseTime: 45,
      target: 30,
      performance: 67,
      trend: 'down',
      color: '#ef4444',
      recentCases: [
        { id: 'CASE-2453', title: 'App crash on checkout', responseTime: 52, status: 'slow' },
        { id: 'CASE-2440', title: 'Login issues', responseTime: 48, status: 'slow' },
        { id: 'CASE-2439', title: 'Cannot update profile', responseTime: 35, status: 'slow' },
      ]
    },
  ];
};

// Cases Over Time interfaces
interface DailyCasesData {
  date: string;
  dayName: string;
  totalCases: number;
  criticalCases: number;
  highCases: number;
  mediumCases: number;
  lowCases: number;
}

const generateMockDailyCases = (): DailyCasesData[] => {
  const data: DailyCasesData[] = [];
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const dayName = dayNames[date.getDay()];
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    // Generate realistic case numbers with variance
    const baseCases = 150 + Math.floor(Math.random() * 100);
    const critical = Math.floor(baseCases * (0.05 + Math.random() * 0.05)); // 5-10%
    const high = Math.floor(baseCases * (0.15 + Math.random() * 0.10)); // 15-25%
    const medium = Math.floor(baseCases * (0.30 + Math.random() * 0.10)); // 30-40%
    const low = baseCases - critical - high - medium;
    
    data.push({
      date: dateStr,
      dayName,
      totalCases: baseCases,
      criticalCases: critical,
      highCases: high,
      mediumCases: medium,
      lowCases: low,
    });
  }
  
  return data;
};

// Channel Cases interfaces
interface ChannelDailyData {
  date: string;
  dayName: string;
  phone: number;
  web: number;
  line: number;
  email: number;
  chat: number;
  total: number;
}

const generateMockChannelCases = (): ChannelDailyData[] => {
  const data: ChannelDailyData[] = [];
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const dayName = dayNames[date.getDay()];
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    
    // Generate realistic channel distribution
    const phone = Math.floor(40 + Math.random() * 30); // 40-70 cases
    const web = Math.floor(30 + Math.random() * 25); // 30-55 cases
    const line = Math.floor(25 + Math.random() * 20); // 25-45 cases
    const email = Math.floor(15 + Math.random() * 15); // 15-30 cases
    const chat = Math.floor(10 + Math.random() * 15); // 10-25 cases
    const total = phone + web + line + email + chat;
    
    data.push({
      date: dateStr,
      dayName,
      phone,
      web,
      line,
      email,
      chat,
      total,
    });
  }
  
  return data;
};

// Goal Achievement interfaces
interface GoalData {
  id: string;
  goalName: string;
  target: number;
  current: number;
  percentage: number;
  status: 'achieved' | 'on-track' | 'at-risk' | 'behind';
  trend: 'up' | 'down' | 'stable';
  color: string;
  deadline: string;
  milestones: {
    name: string;
    completed: boolean;
    date: string;
  }[];
}

const generateMockGoalAchievement = (): GoalData[] => {
  return [
    {
      id: 'goal-001',
      goalName: 'Customer Satisfaction Score',
      target: 95,
      current: 94.2,
      percentage: 99,
      status: 'on-track',
      trend: 'up',
      color: '#10b981',
      deadline: 'Q1 2026',
      milestones: [
        { name: 'Survey implementation', completed: true, date: '2026-01-15' },
        { name: 'Reach 90% satisfaction', completed: true, date: '2026-01-20' },
        { name: 'Reach 95% satisfaction', completed: false, date: '2026-03-31' },
      ]
    },
    {
      id: 'goal-002',
      goalName: 'Avg Resolution Time < 4hrs',
      target: 240,
      current: 252,
      percentage: 95,
      status: 'at-risk',
      trend: 'up',
      color: '#f59e0b',
      deadline: 'Q1 2026',
      milestones: [
        { name: 'Agent training completed', completed: true, date: '2026-01-10' },
        { name: 'Automation tools deployed', completed: true, date: '2026-01-18' },
        { name: 'Reach < 4hrs target', completed: false, date: '2026-03-31' },
      ]
    },
    {
      id: 'goal-003',
      goalName: 'First Response < 15min',
      target: 15,
      current: 12,
      percentage: 125,
      status: 'achieved',
      trend: 'up',
      color: '#22c55e',
      deadline: 'Q1 2026',
      milestones: [
        { name: 'Increase agent capacity', completed: true, date: '2026-01-05' },
        { name: 'Reach < 20min', completed: true, date: '2026-01-12' },
        { name: 'Reach < 15min target', completed: true, date: '2026-01-25' },
      ]
    },
    {
      id: 'goal-004',
      goalName: 'Reduce Critical Cases by 30%',
      target: 70,
      current: 85,
      percentage: 82,
      status: 'behind',
      trend: 'down',
      color: '#ef4444',
      deadline: 'Q1 2026',
      milestones: [
        { name: 'Root cause analysis', completed: true, date: '2026-01-08' },
        { name: 'Reduce by 20%', completed: false, date: '2026-02-28' },
        { name: 'Reach 30% reduction', completed: false, date: '2026-03-31' },
      ]
    },
  ];
};

export function ChartsCarousel({ charts }: ChartsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(2);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [caseSeverityData] = useState<CaseSeverityData[]>(() => generateMockCaseSeverity());
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [severityTrendData] = useState<SeverityTrendData[]>(() => generateMockSeverityTrend());
  const [caseStatusData] = useState<CaseStatusData[]>(() => generateMockCaseStatus());
  const [statusTrendData] = useState<StatusTrendData[]>(() => generateMockStatusTrend());
  const [negativeTrendingData] = useState<NegativeTrendingIssue[]>(() => generateMockNegativeTrending());
  const [businessUnitCriticalData] = useState<BusinessUnitCriticalCase[]>(() => generateMockBusinessUnitCritical());
  const [responseTimeData] = useState<ResponseTimeData[]>(() => generateMockResponseTime());
  const [goalAchievementData] = useState<GoalData[]>(() => generateMockGoalAchievement());
  const [dailyCasesData] = useState<DailyCasesData[]>(() => generateMockDailyCases());
  const [channelCasesData] = useState<ChannelDailyData[]>(() => generateMockChannelCases());

  // Fetch real alerts data from API
  useEffect(() => {
    async function fetchAlerts() {
      try {
        // Fetch all alerts without status filter to get all data
        const response = await fetch('/api/alerts?limit=100&sortBy=created_at&sortOrder=desc');
        
        console.log('[ChartsCarousel] Fetching alerts...');
        
        if (!response.ok) {
          console.error('[ChartsCarousel] Failed to fetch alerts:', response.status);
          setAlerts([]);
          return;
        }

        const data = await response.json();
        const fetchedAlerts = data.alerts || [];
        
        console.log('[ChartsCarousel] Total alerts fetched:', fetchedAlerts.length);
        console.log('[ChartsCarousel] Pagination:', data.pagination);
        
        // Sort by severity and date
        const sortedAlerts = fetchedAlerts.sort((a: Alert, b: Alert) => {
          const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          const aSeverity = severityOrder[a.severity] ?? 4;
          const bSeverity = severityOrder[b.severity] ?? 4;
          
          if (aSeverity !== bSeverity) {
            return aSeverity - bSeverity;
          }
          
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        console.log('[ChartsCarousel] After sorting:', sortedAlerts.length);
        
        // Show all alerts (no slice)
        setAlerts(sortedAlerts);
      } catch (error) {
        console.error('[ChartsCarousel] Error fetching alerts:', error);
        setAlerts([]);
      } finally {
        setIsLoadingAlerts(false);
      }
    }

    fetchAlerts();
  }, []);

  // Calculate cards per view based on window size
  useEffect(() => {
    const updateCardsPerView = () => {
      setCardsPerView(window.innerWidth < 768 ? 1 : 2);
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (isHovered) return;

    const maxIndex = Math.ceil(charts.length / cardsPerView) - 1;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 10000); // Slide every 10 seconds

    return () => clearInterval(interval);
  }, [isHovered, charts.length, cardsPerView]);

  const maxIndex = Math.ceil(charts.length / cardsPerView) - 1;

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
          {charts.map((chart, index) => {
            const Icon = iconMap[chart.icon];
            const isAlertsCard = index === 0;
            const isAlertsListCard = index === 1;
            const isCaseSeverityCard = index === 2;
            const isCaseStatusCard = index === 3;
            const isNegativeTrendingCard = index === 4;
            const isBusinessUnitCriticalCard = index === 5;
            const isResponseTimeCard = index === 6;
            const isGoalAchievementCard = index === 7;
            
            // Calculate severity stats
            const severityStats = {
              critical: caseSeverityData.filter(c => c.severity === 'critical').length,
              high: caseSeverityData.filter(c => c.severity === 'high').length,
              medium: caseSeverityData.filter(c => c.severity === 'medium').length,
              low: caseSeverityData.filter(c => c.severity === 'low').length,
              total: caseSeverityData.length,
            };
            
            const filteredCases = selectedSeverity
              ? caseSeverityData.filter(c => c.severity === selectedSeverity)
              : caseSeverityData;
            
            return (
              <div
                key={index}
                className="flex-shrink-0 px-1"
                style={{ width: `${100 / cardsPerView}%` }}
              >
                {isAlertsCard ? (
                  // Cases Over Time Card
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Cases Over Time
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        Last 7 Days
                      </span>
                    </div>
                    <div className="h-80 flex flex-col">
                      {/* Case Statistics - Compact */}
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5 border border-red-200">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-red-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.criticalCases, 0)}
                            </span>
                            <span className="text-xs text-red-600 ml-1">Critical</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-1.5 border border-orange-200">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-orange-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.highCases, 0)}
                            </span>
                            <span className="text-xs text-orange-600 ml-1">High</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
                          <Activity className="w-4 h-4 text-amber-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-amber-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.mediumCases, 0)}
                            </span>
                            <span className="text-xs text-amber-600 ml-1">Medium</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5 border border-blue-200">
                          <Info className="w-4 h-4 text-blue-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-blue-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.totalCases, 0)}
                            </span>
                            <span className="text-xs text-blue-600 ml-1">Total</span>
                          </div>
                        </div>
                      </div>

                      {/* Line Chart Visualization */}
                      <div className="flex-1 flex flex-col bg-slate-50 rounded-lg p-4">
                        <div className="text-xs font-medium text-slate-600 mb-4">
                          Cases Trend (Last 7 Days) - {dailyCasesData.reduce((sum, day) => sum + day.totalCases, 0)} Total Cases
                        </div>
                        
                        {/* Chart Area */}
                        <div className="flex-1 relative">
                          <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                            {(() => {
                              // Use daily cases data
                              const dataPoints = dailyCasesData;
                              const xStep = 540 / (dataPoints.length - 1);
                              const maxValue = Math.max(
                                ...dataPoints.map(d => Math.max(d.criticalCases, d.highCases)),
                                20 // minimum scale
                              );
                              
                              // Critical cases line path
                              const criticalPath = dataPoints
                                .map((d, i) => {
                                  const x = 40 + i * xStep;
                                  const y = 160 - (d.criticalCases / maxValue) * 140;
                                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                })
                                .join(' ');

                              // High cases line path
                              const highPath = dataPoints
                                .map((d, i) => {
                                  const x = 40 + i * xStep;
                                  const y = 160 - (d.highCases / maxValue) * 140;
                                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                })
                                .join(' ');

                              return (
                                <>
                                  {/* Grid Lines */}
                                  <line x1="40" y1="20" x2="40" y2="160" stroke="#cbd5e1" strokeWidth="2" />
                                  <line x1="40" y1="160" x2="580" y2="160" stroke="#cbd5e1" strokeWidth="2" />
                                  
                                  {/* Horizontal Grid with Y-axis labels */}
                                  {[0, 1, 2, 3, 4].map((i) => {
                                    const yValue = Math.round((i / 4) * maxValue);
                                    
                                    return (
                                      <g key={`grid-${i}`}>
                                        <line
                                          x1="40"
                                          y1={160 - i * 35}
                                          x2="580"
                                          y2={160 - i * 35}
                                          stroke="#e2e8f0"
                                          strokeWidth="1"
                                          strokeDasharray="4 4"
                                        />
                                        <text
                                          x="30"
                                          y={165 - i * 35}
                                          fontSize="10"
                                          fill="#64748b"
                                          textAnchor="end"
                                        >
                                          {yValue}
                                        </text>
                                      </g>
                                    );
                                  })}

                                  {/* High Cases Line (orange) */}
                                  <path
                                    d={highPath}
                                    fill="none"
                                    stroke="#f97316"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all"
                                  />

                                  {/* Critical Cases Line (red, prominent) */}
                                  <path
                                    d={criticalPath}
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all"
                                  />

                                  {/* Data Points and Labels */}
                                  {dataPoints.map((d, i) => {
                                    const x = 40 + i * xStep;
                                    const yCritical = 160 - (d.criticalCases / maxValue) * 140;
                                    const yHigh = 160 - (d.highCases / maxValue) * 140;
                                    
                                    return (
                                      <g key={i}>
                                        {/* High point (orange) */}
                                        <circle
                                          cx={x}
                                          cy={yHigh}
                                          r="4"
                                          fill="#f97316"
                                          stroke="white"
                                          strokeWidth="2"
                                        />
                                        
                                        {/* Critical point (red) */}
                                        <circle
                                          cx={x}
                                          cy={yCritical}
                                          r="4"
                                          fill="#ef4444"
                                          stroke="white"
                                          strokeWidth="2"
                                        />
                                        
                                        {/* Value label for critical */}
                                        <text
                                          x={x}
                                          y={yCritical - 10}
                                          fontSize="10"
                                          fontWeight="bold"
                                          fill="#dc2626"
                                          textAnchor="middle"
                                        >
                                          {d.criticalCases}
                                        </text>
                                        
                                        {/* Value label for high */}
                                        <text
                                          x={x}
                                          y={yHigh - 10}
                                          fontSize="10"
                                          fontWeight="bold"
                                          fill="#ea580c"
                                          textAnchor="middle"
                                        >
                                          {d.highCases}
                                        </text>
                                        
                                        {/* Date label */}
                                        <text
                                          x={x}
                                          y="180"
                                          fontSize="9"
                                          fill="#64748b"
                                          textAnchor="middle"
                                        >
                                          {d.date}
                                        </text>
                                        {/* Day name label */}
                                          <text
                                            x={x}
                                            y="192"
                                            fontSize="8"
                                            fill="#94a3b8"
                                            textAnchor="middle"
                                          >
                                            {d.dayName}
                                          </text>
                                      </g>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-red-500 rounded"></div>
                            <span className="text-sm font-semibold text-red-700">Critical</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-orange-500 rounded"></div>
                            <span className="text-sm font-semibold text-orange-700">High</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isAlertsListCard ? (
                  // Alerts List Card (Critical First)
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Active Alerts
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                        {alerts.length} Total
                      </span>
                    </div>
                    <div className="space-y-2 h-80 overflow-y-auto pr-1">
                      {isLoadingAlerts ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                          Loading alerts...
                        </div>
                      ) : alerts.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                          No active alerts
                        </div>
                      ) : (
                        alerts.map((alert) => (
                          <div
                            key={alert.id}
                            className={`p-3 rounded-lg border transition-all hover:shadow-md ${
                              alert.severity === 'critical'
                                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                : 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {alert.severity === 'critical' ? (
                                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4
                                    className={`text-sm font-semibold ${
                                      alert.severity === 'critical'
                                        ? 'text-red-900'
                                        : 'text-amber-900'
                                    }`}
                                  >
                                    {alert.title}
                                  </h4>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                                      alert.severity === 'critical'
                                        ? 'bg-red-200 text-red-800'
                                        : 'bg-amber-200 text-amber-800'
                                    }`}
                                  >
                                    {alert.severity.toUpperCase()}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs mt-1 ${
                                    alert.severity === 'critical'
                                      ? 'text-red-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {alert.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-slate-500">{formatRelativeTime(alert.created_at)}</p>
                                  <a
                                    href={`/alerts/${alert.id}`}
                                    className={`text-xs font-medium hover:underline ${
                                      alert.severity === 'critical'
                                        ? 'text-red-700'
                                        : 'text-amber-700'
                                    }`}
                                  >
                                    View Details →
                                  </a>
                                </div>
                              </div>
                            </div>

                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : isCaseSeverityCard ? (
                  // Case Severity Distribution - Donut Chart (Focus on Critical & High)
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-purple-600" />
                        Priority Case Distribution
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Critical & High severity focus</p>
                    </div>
                    
                    <div className="h-80 flex flex-col">
                      {/* Calculate totals from latest data */}
                      {(() => {
                        const latestData = severityTrendData[severityTrendData.length - 1];
                        const total = latestData.critical + latestData.high + latestData.medium + latestData.low;
                        const criticalHighTotal = latestData.critical + latestData.high;
                        const criticalHighPercentage = ((criticalHighTotal / total) * 100).toFixed(1);
                        
                        const severityData = [
                          { label: 'Critical', value: latestData.critical, color: '#dc2626', lightColor: '#fee2e2' },
                          { label: 'High', value: latestData.high, color: '#ea580c', lightColor: '#ffedd5' },
                          { label: 'Medium', value: latestData.medium, color: '#94a3b8', lightColor: '#f1f5f9' },
                          { label: 'Low', value: latestData.low, color: '#cbd5e1', lightColor: '#f8fafc' },
                        ];

                        const maxValue = Math.max(...severityData.map(d => d.value));

                        return (
                          <>
                            {/* Priority Stats - Focus on Critical & High */}
                            <div className="grid grid-cols-2 gap-3 mb-0.5">
                              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 border-2 border-red-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertOctagon className="w-4 h-4 text-red-600" />
                                  <p className="text-xs font-semibold text-red-900">Critical</p>
                                </div>
                                <p className="text-2xl font-bold text-red-700 mb-1">{latestData.critical}</p>
                                <p className="text-xs text-red-600">{((latestData.critical / total) * 100).toFixed(1)}% of total</p>
                              </div>
                              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 border-2 border-orange-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                  <p className="text-xs font-semibold text-orange-900">High</p>
                                </div>
                                <p className="text-2xl font-bold text-orange-700 mb-1">{latestData.high}</p>
                                <p className="text-xs text-orange-600">{((latestData.high / total) * 100).toFixed(1)}% of total</p>
                              </div>
                            </div>

                            {/* Donut Chart with Left Legend and Right Cases */}
                            <div className="flex-1 flex items-center justify-start gap-3 pl-2">
                              {/* Legend - Vertical Left Side - Compact */}
                              <div className="flex flex-col gap-1.5">
                                {severityData.map((item, index) => (
                                  <div key={index} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                                    <div className="text-left">
                                      <p className="text-[9px] font-semibold text-slate-700 leading-tight">{item.label}</p>
                                      <p className="text-xs font-bold text-slate-900 leading-tight">{item.value}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Donut Chart - Smaller Size */}
                              <div className="relative flex-shrink-0 w-[180px]">
                                <svg viewBox="0 0 140 140" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                  {(() => {
                                    const centerX = 70;
                                    const centerY = 70;
                                    const radius = 50;
                                    const innerRadius = 36;
                                    let currentAngle = -90; // Start from top

                                    const createArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
                                      const startRad = (startAngle * Math.PI) / 180;
                                      const endRad = (endAngle * Math.PI) / 180;
                                      
                                      const x1 = centerX + outerR * Math.cos(startRad);
                                      const y1 = centerY + outerR * Math.sin(startRad);
                                      const x2 = centerX + outerR * Math.cos(endRad);
                                      const y2 = centerY + outerR * Math.sin(endRad);
                                      
                                      const x3 = centerX + innerR * Math.cos(endRad);
                                      const y3 = centerY + innerR * Math.sin(endRad);
                                      const x4 = centerX + innerR * Math.cos(startRad);
                                      const y4 = centerY + innerR * Math.sin(startRad);
                                      
                                      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                                      
                                      return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
                                    };

                                    return (
                                      <>
                                        {severityData.map((item, index) => {
                                          const percentage = (item.value / total) * 100;
                                          const angle = (percentage / 100) * 360;
                                          const endAngle = currentAngle + angle;
                                          
                                          const path = createArc(currentAngle, endAngle, radius, innerRadius);
                                          
                                          currentAngle = endAngle;
                                          
                                          return (
                                            <path
                                              key={index}
                                              d={path}
                                              fill={item.color}
                                              stroke="white"
                                              strokeWidth="2"
                                            />
                                          );
                                        })}
                                        
                                        {/* Center circle with stats */}
                                        <circle cx={centerX} cy={centerY} r={innerRadius} fill="white" />
                                        <circle cx={centerX} cy={centerY} r={innerRadius} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                                        
                                        <text x={centerX} y={centerY - 8} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#dc2626">
                                          {criticalHighTotal}
                                        </text>
                                        <text x={centerX} y={centerY + 2} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="500">
                                          Priority Cases
                                        </text>
                                        <text x={centerX} y={centerY + 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ea580c">
                                          {criticalHighPercentage}%
                                        </text>
                                      </>
                                    );
                                  })()}
                                </svg>
                              </div>

                              {/* Recent Critical Cases - Right Side */}
                              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <AlertOctagon className="w-3 h-3 text-red-600 flex-shrink-0" />
                                  <p className="text-[9px] font-semibold text-red-900 uppercase">Critical Cases</p>
                                </div>
                                {caseSeverityData
                                  .filter(c => c.severity === 'critical')
                                  .slice(-3)
                                  .reverse()
                                  .map((item, idx) => (
                                    <div key={idx} className="bg-red-50 border border-red-200 rounded px-2 py-1 min-w-0">
                                      <p className="text-[9px] font-semibold text-red-900 truncate leading-tight">
                                        {item.title}
                                      </p>
                                      <p className="text-[8px] text-red-600 truncate leading-tight mt-0.5">
                                        ID: {item.id.slice(0, 8)}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>

                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : isCaseStatusCard ? (
                  // Case Status Overview Card
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <PieChart className="w-4 h-4 text-blue-600" />
                        Case Status Overview
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">In Progress & Open focus</p>
                    </div>
                    
                    <div className="h-80 flex flex-col">
                      {/* Calculate totals from latest data */}
                      {(() => {
                        const latestData = statusTrendData[statusTrendData.length - 1];
                        const total = latestData.in_progress + latestData.open + latestData.resolved + latestData.closed;
                        const inProgressOpenTotal = latestData.in_progress + latestData.open;
                        const inProgressOpenPercentage = ((inProgressOpenTotal / total) * 100).toFixed(1);
                        
                        const statusData = [
                          { label: 'In Progress', value: latestData.in_progress, color: '#3b82f6', lightColor: '#dbeafe' },
                          { label: 'Open', value: latestData.open, color: '#8b5cf6', lightColor: '#ede9fe' },
                          { label: 'Resolved', value: latestData.resolved, color: '#10b981', lightColor: '#d1fae5' },
                          { label: 'Closed', value: latestData.closed, color: '#6b7280', lightColor: '#f3f4f6' },
                        ];

                        const maxValue = Math.max(...statusData.map(d => d.value));

                        return (
                          <>
                            {/* Priority Stats - Focus on In Progress & Open */}
                            <div className="grid grid-cols-2 gap-3 mb-0.5">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="w-4 h-4 text-blue-600" />
                                  <p className="text-xs font-semibold text-blue-900">In Progress</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-700 mb-1">{latestData.in_progress}</p>
                                <p className="text-xs text-blue-600">{((latestData.in_progress / total) * 100).toFixed(1)}% of total</p>
                              </div>
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border-2 border-purple-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <Info className="w-4 h-4 text-purple-600" />
                                  <p className="text-xs font-semibold text-purple-900">Open</p>
                                </div>
                                <p className="text-2xl font-bold text-purple-700 mb-1">{latestData.open}</p>
                                <p className="text-xs text-purple-600">{((latestData.open / total) * 100).toFixed(1)}% of total</p>
                              </div>
                            </div>

                            {/* Donut Chart with Left Legend and Right Cases */}
                            <div className="flex-1 flex items-center justify-start gap-3 pl-2">
                              {/* Legend - Vertical Left Side - Compact */}
                              <div className="flex flex-col gap-1.5">
                                {statusData.map((item, index) => (
                                  <div key={index} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                                    <div className="text-left">
                                      <p className="text-[9px] font-semibold text-slate-700 leading-tight">{item.label}</p>
                                      <p className="text-xs font-bold text-slate-900 leading-tight">{item.value}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Donut Chart - Smaller Size */}
                              <div className="relative flex-shrink-0 w-[180px]">
                                <svg viewBox="0 0 140 140" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                                  {(() => {
                                    const centerX = 70;
                                    const centerY = 70;
                                    const radius = 50;
                                    const innerRadius = 36;
                                    let currentAngle = -90; // Start from top

                                    const createArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
                                      const startRad = (startAngle * Math.PI) / 180;
                                      const endRad = (endAngle * Math.PI) / 180;
                                      
                                      const x1 = centerX + outerR * Math.cos(startRad);
                                      const y1 = centerY + outerR * Math.sin(startRad);
                                      const x2 = centerX + outerR * Math.cos(endRad);
                                      const y2 = centerY + outerR * Math.sin(endRad);
                                      
                                      const x3 = centerX + innerR * Math.cos(endRad);
                                      const y3 = centerY + innerR * Math.sin(endRad);
                                      const x4 = centerX + innerR * Math.cos(startRad);
                                      const y4 = centerY + innerR * Math.sin(startRad);
                                      
                                      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                                      
                                      return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
                                    };

                                    return (
                                      <>
                                        {statusData.map((item, index) => {
                                          const percentage = (item.value / total) * 100;
                                          const angle = (percentage / 100) * 360;
                                          const endAngle = currentAngle + angle;
                                          
                                          const path = createArc(currentAngle, endAngle, radius, innerRadius);
                                          
                                          currentAngle = endAngle;
                                          
                                          return (
                                            <path
                                              key={index}
                                              d={path}
                                              fill={item.color}
                                              stroke="white"
                                              strokeWidth="2"
                                            />
                                          );
                                        })}
                                        
                                        {/* Center circle with stats */}
                                        <circle cx={centerX} cy={centerY} r={innerRadius} fill="white" />
                                        <circle cx={centerX} cy={centerY} r={innerRadius} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
                                        
                                        <text x={centerX} y={centerY - 8} textAnchor="middle" fontSize="20" fontWeight="bold" fill="#3b82f6">
                                          {inProgressOpenTotal}
                                        </text>
                                        <text x={centerX} y={centerY + 2} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="500">
                                          Active Cases
                                        </text>
                                        <text x={centerX} y={centerY + 14} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#8b5cf6">
                                          {inProgressOpenPercentage}%
                                        </text>
                                      </>
                                    );
                                  })()}
                                </svg>
                              </div>

                              {/* Recent In Progress Cases - Right Side */}
                              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Activity className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                  <p className="text-[9px] font-semibold text-blue-900 uppercase">In Progress</p>
                                </div>
                                {caseStatusData
                                  .filter(c => c.status === 'in_progress')
                                  .slice(-3)
                                  .reverse()
                                  .map((item, idx) => (
                                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded px-2 py-1 min-w-0">
                                      <p className="text-[9px] font-semibold text-blue-900 truncate leading-tight">
                                        {item.title}
                                      </p>
                                      <p className="text-[8px] text-blue-600 truncate leading-tight mt-0.5">
                                        ID: {item.id.slice(0, 8)}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>

                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : isNegativeTrendingCard ? (
                  // Negative Trending Issues Card
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-red-600" />
                        Negative Trending Issues
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Top issues with negative feedback</p>
                    </div>
                    
                    <div className="h-80 flex flex-col gap-2 overflow-y-auto">
                      {negativeTrendingData.map((issue, idx) => {
                        const negativePercentage = ((issue.negativeCount / issue.totalCount) * 100).toFixed(1);
                        const barWidth = (issue.negativeCount / negativeTrendingData[0].negativeCount) * 100;
                        
                        return (
                          <div key={issue.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-red-900 truncate">{issue.category}</h4>
                                  <p className="text-xs text-red-700 mt-0.5">
                                    {issue.negativeCount} negative / {issue.totalCount} total ({negativePercentage}%)
                                  </p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                                issue.trend === 'up' 
                                  ? 'bg-red-200 text-red-900' 
                                  : 'bg-green-200 text-green-900'
                              }`}>
                                {issue.trend === 'up' ? '↑' : '↓'} {Math.abs(issue.percentChange)}%
                              </div>
                            </div>

                            {/* Bar Chart */}
                            <div className="mb-2">
                              <div className="w-full bg-red-100 rounded-full h-2">
                                <div 
                                  className="bg-red-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${barWidth}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Top Complaints */}
                            <div className="flex flex-wrap gap-1.5">
                              {issue.topComplaints.map((complaint, cIdx) => (
                                <span 
                                  key={cIdx}
                                  className="px-2 py-0.5 bg-white border border-red-300 rounded text-[10px] text-red-800"
                                >
                                  {complaint}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : isBusinessUnitCriticalCard ? (
                  // Business Unit Critical Cases Card
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-orange-600" />
                        Business Unit Critical Cases
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Active Critical & High severity by department</p>
                    </div>
                    
                    <div className="h-80 flex flex-col gap-2 overflow-y-auto">
                      {businessUnitCriticalData.map((unit, idx) => {
                        const criticalPercentage = ((unit.criticalCount / unit.totalActive) * 100).toFixed(0);
                        const highPercentage = ((unit.highCount / unit.totalActive) * 100).toFixed(0);
                        const maxBarWidth = (unit.totalActive / businessUnitCriticalData[0].totalActive) * 100;
                        
                        return (
                          <div key={unit.id} className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white text-xs font-bold flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-orange-900 truncate">{unit.businessUnit}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-red-700 font-semibold">
                                      🔴 {unit.criticalCount} Critical
                                    </span>
                                    <span className="text-xs text-orange-700 font-semibold">
                                      🟠 {unit.highCount} High
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-lg font-bold text-orange-900">{unit.totalActive}</div>
                                <div className="text-[9px] text-slate-600">active cases</div>
                              </div>
                            </div>

                            {/* Status Breakdown */}
                            <div className="flex gap-2 mb-2">
                              <div className="flex-1 bg-blue-100 rounded px-2 py-1 border border-blue-300">
                                <div className="text-[9px] text-blue-700 font-semibold">In Progress</div>
                                <div className="text-sm font-bold text-blue-900">{unit.inProgressCount}</div>
                              </div>
                              <div className="flex-1 bg-purple-100 rounded px-2 py-1 border border-purple-300">
                                <div className="text-[9px] text-purple-700 font-semibold">Open</div>
                                <div className="text-sm font-bold text-purple-900">{unit.openCount}</div>
                              </div>
                            </div>

                            {/* Bar Chart - Stacked */}
                            <div className="mb-2">
                              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                                <div 
                                  className="bg-red-600 h-3 transition-all duration-500"
                                  style={{ width: `${(unit.criticalCount / unit.totalActive) * maxBarWidth}%` }}
                                  title={`Critical: ${unit.criticalCount}`}
                                ></div>
                                <div 
                                  className="bg-orange-500 h-3 transition-all duration-500"
                                  style={{ width: `${(unit.highCount / unit.totalActive) * maxBarWidth}%` }}
                                  title={`High: ${unit.highCount}`}
                                ></div>
                              </div>
                            </div>

                            {/* Top Cases */}
                            <div className="space-y-1">
                              <div className="text-[9px] text-slate-600 font-semibold mb-1">TOP CASES:</div>
                              {unit.topCases.map((case_, cIdx) => (
                                <div 
                                  key={cIdx}
                                  className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] ${
                                    case_.severity === 'critical' 
                                      ? 'bg-red-100 border border-red-300 text-red-900' 
                                      : 'bg-orange-100 border border-orange-300 text-orange-900'
                                  }`}
                                >
                                  <span className="font-mono font-semibold">{case_.id}</span>
                                  <span className="flex-1 truncate">{case_.title}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${
                                    case_.status === 'in_progress' 
                                      ? 'bg-blue-200 text-blue-900' 
                                      : 'bg-purple-200 text-purple-900'
                                  }`}>
                                    {case_.status === 'in_progress' ? 'In Progress' : 'Open'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : isResponseTimeCard ? (
                  // Cases Daily Trend Card (Line Chart)
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Daily Cases Trend
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Last 7 Days
                      </span>
                    </div>
                    <div className="h-80 flex flex-col">
                      {/* Case Statistics - Compact */}
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-1.5 border border-red-200">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-red-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.criticalCases, 0)}
                            </span>
                            <span className="text-xs text-red-600 ml-1">Critical</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-1.5 border border-orange-200">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-orange-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.highCases, 0)}
                            </span>
                            <span className="text-xs text-orange-600 ml-1">High</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
                          <Activity className="w-4 h-4 text-amber-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-amber-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.mediumCases, 0)}
                            </span>
                            <span className="text-xs text-amber-600 ml-1">Medium</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-1.5 border border-green-200">
                          <Info className="w-4 h-4 text-green-600" />
                          <div className="text-center">
                            <span className="text-lg font-bold text-green-700">
                              {dailyCasesData.reduce((sum, day) => sum + day.totalCases, 0)}
                            </span>
                            <span className="text-xs text-green-600 ml-1">Total</span>
                          </div>
                        </div>
                      </div>

                      {/* Line Chart Visualization */}
                      <div className="flex-1 flex flex-col bg-slate-50 rounded-lg p-4">
                        <div className="text-xs font-medium text-slate-600 mb-4">
                          Daily Cases Trend - {dailyCasesData.reduce((sum, day) => sum + day.totalCases, 0)} Total Cases
                        </div>
                        
                        {/* Chart Area */}
                        <div className="flex-1 relative">
                          <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                            {(() => {
                              // Use daily cases data
                              const dataPoints = dailyCasesData;
                              const xStep = 540 / (dataPoints.length - 1);
                              const maxValue = Math.max(
                                ...dataPoints.map(d => Math.max(d.criticalCases, d.highCases)),
                                20 // minimum scale
                              );
                              
                              // Critical cases line path
                              const criticalPath = dataPoints
                                .map((d, i) => {
                                  const x = 40 + i * xStep;
                                  const y = 160 - (d.criticalCases / maxValue) * 140;
                                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                })
                                .join(' ');

                              // High cases line path
                              const highPath = dataPoints
                                .map((d, i) => {
                                  const x = 40 + i * xStep;
                                  const y = 160 - (d.highCases / maxValue) * 140;
                                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                })
                                .join(' ');

                              return (
                                <>
                                  {/* Grid Lines */}
                                  <line x1="40" y1="20" x2="40" y2="160" stroke="#cbd5e1" strokeWidth="2" />
                                  <line x1="40" y1="160" x2="580" y2="160" stroke="#cbd5e1" strokeWidth="2" />
                                  
                                  {/* Horizontal Grid with Y-axis labels */}
                                  {[0, 1, 2, 3, 4].map((i) => {
                                    const yValue = Math.round((i / 4) * maxValue);
                                    
                                    return (
                                      <g key={`grid-${i}`}>
                                        <line
                                          x1="40"
                                          y1={160 - i * 35}
                                          x2="580"
                                          y2={160 - i * 35}
                                          stroke="#e2e8f0"
                                          strokeWidth="1"
                                          strokeDasharray="4 4"
                                        />
                                        <text
                                          x="30"
                                          y={165 - i * 35}
                                          fontSize="10"
                                          fill="#64748b"
                                          textAnchor="end"
                                        >
                                          {yValue}
                                        </text>
                                      </g>
                                    );
                                  })}

                                  {/* High Cases Line (orange) */}
                                  <path
                                    d={highPath}
                                    fill="none"
                                    stroke="#f97316"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all"
                                  />

                                  {/* Critical Cases Line (red, prominent) */}
                                  <path
                                    d={criticalPath}
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="transition-all"
                                  />

                                  {/* Data Points and Labels */}
                                  {dataPoints.map((d, i) => {
                                    const x = 40 + i * xStep;
                                    const yCritical = 160 - (d.criticalCases / maxValue) * 140;
                                    const yHigh = 160 - (d.highCases / maxValue) * 140;
                                    
                                    return (
                                      <g key={i}>
                                        {/* High point (orange) */}
                                        <circle
                                          cx={x}
                                          cy={yHigh}
                                          r="4"
                                          fill="#f97316"
                                          stroke="white"
                                          strokeWidth="2"
                                        />
                                        
                                        {/* Critical point (red) */}
                                        <circle
                                          cx={x}
                                          cy={yCritical}
                                          r="4"
                                          fill="#ef4444"
                                          stroke="white"
                                          strokeWidth="2"
                                        />
                                        
                                        {/* Value label for critical */}
                                        <text
                                          x={x}
                                          y={yCritical - 10}
                                          fontSize="10"
                                          fontWeight="bold"
                                          fill="#dc2626"
                                          textAnchor="middle"
                                        >
                                          {d.criticalCases}
                                        </text>
                                        
                                        {/* Value label for high */}
                                        <text
                                          x={x}
                                          y={yHigh - 10}
                                          fontSize="10"
                                          fontWeight="bold"
                                          fill="#ea580c"
                                          textAnchor="middle"
                                        >
                                          {d.highCases}
                                        </text>
                                        
                                        {/* Date label */}
                                        <text
                                          x={x}
                                          y="180"
                                          fontSize="9"
                                          fill="#64748b"
                                          textAnchor="middle"
                                        >
                                          {d.date}
                                        </text>
                                        {/* Day name label */}
                                        <text
                                          x={x}
                                          y="192"
                                          fontSize="8"
                                          fill="#94a3b8"
                                          textAnchor="middle"
                                        >
                                          {d.dayName}
                                        </text>
                                      </g>
                                    );
                                  })}
                                </>
                              );
                            })()}
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-red-500 rounded"></div>
                            <span className="text-sm font-semibold text-red-700">Critical</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-1 bg-orange-500 rounded"></div>
                            <span className="text-sm font-semibold text-orange-700">High</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isGoalAchievementCard ? (
                  // Channel Cases Distribution Card
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-600" />
                        Cases by Channel
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        Last 7 Days
                      </span>
                    </div>
                    <div className="h-80 flex flex-col">
                      {/* Channel Statistics - Compact */}
                      <div className="grid grid-cols-5 gap-2 mb-2">
                        <div className="flex flex-col items-center gap-0.5 bg-blue-50 rounded px-2 py-1 border border-blue-200">
                          <span className="text-[9px] font-semibold text-blue-700 uppercase">Phone</span>
                          <span className="text-sm font-bold text-blue-900">
                            {channelCasesData.reduce((sum, day) => sum + day.phone, 0)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 bg-orange-50 rounded px-2 py-1 border border-orange-200">
                          <span className="text-[9px] font-semibold text-orange-700 uppercase">Web</span>
                          <span className="text-sm font-bold text-orange-900">
                            {channelCasesData.reduce((sum, day) => sum + day.web, 0)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 bg-emerald-50 rounded px-2 py-1 border border-emerald-200">
                          <span className="text-[9px] font-semibold text-emerald-700 uppercase">Line</span>
                          <span className="text-sm font-bold text-emerald-900">
                            {channelCasesData.reduce((sum, day) => sum + day.line, 0)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 bg-amber-50 rounded px-2 py-1 border border-amber-200">
                          <span className="text-[9px] font-semibold text-amber-700 uppercase">Email</span>
                          <span className="text-sm font-bold text-amber-900">
                            {channelCasesData.reduce((sum, day) => sum + day.email, 0)}
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5 bg-purple-50 rounded px-2 py-1 border border-purple-200">
                          <span className="text-[9px] font-semibold text-purple-700 uppercase">Chat</span>
                          <span className="text-sm font-bold text-purple-900">
                            {channelCasesData.reduce((sum, day) => sum + day.chat, 0)}
                          </span>
                        </div>
                      </div>

                      {/* Bar Chart Visualization */}
                      <div className="flex-1 flex flex-col bg-slate-50 rounded-lg p-3">
                        <div className="text-[11px] font-medium text-slate-600 mb-2">
                          Daily Cases by Channel (Phone, Web, Line)
                        </div>
                        
                        {/* Chart Area - Grouped Bar Chart */}
                        <div className="flex-1 flex items-end justify-between gap-3">
                          {(() => {
                            // Calculate max value once for all bars
                            const maxValue = Math.max(...channelCasesData.flatMap(d => [d.phone, d.web, d.line]));
                            
                            return channelCasesData.map((day, dayIdx) => {
                              // Calculate heights as percentage of maxValue
                              const phoneHeight = (day.phone / maxValue) * 100;
                              const webHeight = (day.web / maxValue) * 100;
                              const lineHeight = (day.line / maxValue) * 100;
                              
                              return (
                                <div key={dayIdx} className="flex-1 flex flex-col items-center gap-1.5">
                                  {/* Grouped Bars - Container with fixed height */}
                                  <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '140px' }}>
                                    {/* Phone Bar */}
                                    <div className="flex-1 flex flex-col justify-end items-center h-full">
                                      <div 
                                        className="w-full bg-blue-500 rounded-t transition-all duration-500 flex items-center justify-center"
                                        style={{ 
                                          height: `${phoneHeight}%`,
                                          minHeight: phoneHeight > 0 ? '4px' : '0px'
                                        }}
                                        title={`Phone: ${day.phone}`}
                                      >
                                        {phoneHeight > 20 && (
                                          <span className="text-[8px] font-bold text-white">{day.phone}</span>
                                        )}
                                      </div>
                                    </div>
                                    {/* Web Bar */}
                                    <div className="flex-1 flex flex-col justify-end items-center h-full">
                                      <div 
                                        className="w-full bg-orange-500 rounded-t transition-all duration-500 flex items-center justify-center"
                                        style={{ 
                                          height: `${webHeight}%`,
                                          minHeight: webHeight > 0 ? '4px' : '0px'
                                        }}
                                        title={`Web: ${day.web}`}
                                      >
                                        {webHeight > 20 && (
                                          <span className="text-[8px] font-bold text-white">{day.web}</span>
                                        )}
                                      </div>
                                    </div>
                                    {/* Line Bar */}
                                    <div className="flex-1 flex flex-col justify-end items-center h-full">
                                      <div 
                                        className="w-full bg-emerald-500 rounded-t transition-all duration-500 flex items-center justify-center"
                                        style={{ 
                                          height: `${lineHeight}%`,
                                          minHeight: lineHeight > 0 ? '4px' : '0px'
                                        }}
                                        title={`Line: ${day.line}`}
                                      >
                                        {lineHeight > 20 && (
                                          <span className="text-[8px] font-bold text-white">{day.line}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                
                                  {/* Date */}
                                  <div className="text-center">
                                    <div className="text-[9px] text-slate-600">{day.date}</div>
                                    <div className="text-[8px] text-slate-500">{day.dayName}</div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-2 rounded bg-blue-500"></div>
                            <span className="text-[11px] font-semibold text-slate-700">Phone</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-2 rounded bg-orange-500"></div>
                            <span className="text-[11px] font-semibold text-slate-700">Web</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-2 rounded bg-emerald-500"></div>
                            <span className="text-[11px] font-semibold text-slate-700">Line</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular Chart Card
                  <div className="bg-white rounded-xl border border-slate-200 p-4 w-full box-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900">{chart.title}</h3>
                      <Icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex items-center justify-center bg-slate-50 rounded-lg h-80">
                      <Icon className="w-10 h-10 text-slate-300" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Indicators */}
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
    </div>
  );
}


