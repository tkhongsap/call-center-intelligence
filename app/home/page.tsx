import { Header } from '@/components/layout/Header';
import { AlertTriangle, TrendingUp, Activity, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      <Header title="Control Tower" />
      <div className="flex-1 p-6 overflow-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Active Alerts"
            value="12"
            change="+3 today"
            changeType="warning"
            icon={AlertTriangle}
          />
          <StatCard
            title="Trending Topics"
            value="5"
            change="+2 rising"
            changeType="info"
            icon={TrendingUp}
          />
          <StatCard
            title="Open Cases"
            value="847"
            change="-12% vs yesterday"
            changeType="success"
            icon={FileText}
          />
          <StatCard
            title="Resolution Rate"
            value="94.2%"
            change="+2.1% this week"
            changeType="success"
            icon={Activity}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live Feed */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Live Feed</h2>
              <p className="text-sm text-slate-500">Real-time updates from your call center</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <FeedItem
                  type="alert"
                  title="Fraud Reports Spike - Credit Cards"
                  description="Volume increased by 78% in the last 4 hours"
                  time="2 min ago"
                  severity="high"
                />
                <FeedItem
                  type="trending"
                  title="Trending: Mobile App Login Failures"
                  description="156 cases reported - Rising 45%"
                  time="15 min ago"
                  severity="medium"
                />
                <FeedItem
                  type="alert"
                  title="Account Access Issues Surge"
                  description="Login failures up 125% following app update"
                  time="1 hour ago"
                  severity="critical"
                />
                <FeedItem
                  type="highlight"
                  title="Daily Summary: Top Issues"
                  description="Mobile Banking and Credit Cards seeing highest volumes"
                  time="3 hours ago"
                  severity="info"
                />
              </div>
            </div>
          </div>

          {/* Pulse Sidebar */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Pulse</h2>
              <p className="text-sm text-slate-500">Key metrics at a glance</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Top BUs */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Top Business Units</h3>
                <div className="space-y-2">
                  <PulseBar label="Credit Cards" value={156} max={200} color="blue" />
                  <PulseBar label="Mobile Banking" value={134} max={200} color="green" />
                  <PulseBar label="Online Banking" value={98} max={200} color="purple" />
                </div>
              </div>

              {/* Sentiment */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Sentiment Breakdown</h3>
                <div className="space-y-2">
                  <PulseBar label="Positive" value={42} max={100} color="green" />
                  <PulseBar label="Neutral" value={38} max={100} color="slate" />
                  <PulseBar label="Negative" value={20} max={100} color="red" />
                </div>
              </div>

              {/* Channels */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-3">Channel Distribution</h3>
                <div className="space-y-2">
                  <PulseBar label="Phone" value={45} max={100} color="blue" />
                  <PulseBar label="Email" value={28} max={100} color="green" />
                  <PulseBar label="LINE" value={17} max={100} color="green" />
                  <PulseBar label="Web" value={10} max={100} color="purple" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'success' | 'warning' | 'info';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const changeColors = {
    success: 'text-green-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          <p className={`text-sm mt-1 ${changeColors[changeType]}`}>{change}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-600" />
        </div>
      </div>
    </div>
  );
}

// Feed Item Component
function FeedItem({
  type: _type,
  title,
  description,
  time,
  severity,
}: {
  type: 'alert' | 'trending' | 'highlight';
  title: string;
  description: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
}) {
  // type is used for future filtering/rendering logic
  void _type;

  const severityColors = {
    critical: 'bg-red-100 border-red-200',
    high: 'bg-amber-100 border-amber-200',
    medium: 'bg-yellow-100 border-yellow-200',
    info: 'bg-blue-100 border-blue-200',
  };

  const severityDot = {
    critical: 'bg-red-500',
    high: 'bg-amber-500',
    medium: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[severity]}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${severityDot[severity]}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">{title}</h4>
            <span className="text-xs text-slate-500">{time}</span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

// Pulse Bar Component
function PulseBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: 'blue' | 'green' | 'purple' | 'red' | 'slate';
}) {
  const percentage = (value / max) * 100;

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    slate: 'bg-slate-400',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-900 font-medium">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
