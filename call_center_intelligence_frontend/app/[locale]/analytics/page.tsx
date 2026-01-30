import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { MetricsCarousel, type Metric } from '@/components/analytics/MetricsCarousel';
import { ChartsCarousel, type Chart } from '@/components/analytics/ChartsCarousel';

export default async function AnalyticsPage() {
  const t = await getTranslations('pages.analytics');

  const metrics: Metric[] = [
    {
      label: 'Total Cases',
      value: '2,847',
      change: '+12.5%',
      trend: 'up' as const,
      icon: 'MessageSquare',
    },
    {
      label: 'Avg. Resolution Time',
      value: '4.2h',
      change: '-8.3%',
      trend: 'down' as const,
      icon: 'Clock',
    },
    {
      label: 'Customer Satisfaction',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up' as const,
      icon: 'Target',
    },
    {
      label: 'Active Agents',
      value: '127',
      change: '+5',
      trend: 'up' as const,
      icon: 'Users',
    },
    {
      label: 'Response Rate',
      value: '98.5%',
      change: '+3.2%',
      trend: 'up' as const,
      icon: 'TrendingUp',
    },
    {
      label: 'System Uptime',
      value: '99.9%',
      change: '+0.1%',
      trend: 'up' as const,
      icon: 'Activity',
    },
    {
      label: 'Resolved Issues',
      value: '2,654',
      change: '+15.8%',
      trend: 'up' as const,
      icon: 'CheckCircle',
    },
  ];

  const charts: Chart[] = [
    { title: 'Cases Over Time', icon: 'BarChart3' },
    { title: 'Trending Categories', icon: 'TrendingUp' },
    { title: 'Category Distribution', icon: 'PieChart' },
    { title: 'Case Status Overview', icon: 'PieChart' },
    { title: 'Negative Trending Issues', icon: 'TrendingUp' },
    { title: 'Business Unit Critical Cases', icon: 'Users' },
    { title: 'Response Time Analysis', icon: 'Clock' },
    { title: 'Cases by Channel', icon: 'Activity' },
  ];

  return (
    <>
      <Header title={t('title')} />
      <div className="flex-1 px-1 py-4 md:px-2 md:py-6 overflow-x-hidden w-full box-border">
        <div className="max-w-7xl mx-auto space-y-6 w-full overflow-x-hidden box-border">
          {/* Metrics Carousel - Multiple cards at once */}
          <MetricsCarousel metrics={metrics} />

          {/* Charts Carousel - One card at a time */}
          <ChartsCarousel charts={charts} />

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {t('topPerformingAgents')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">{t('agent')}</th>
                    <th className="pb-3 font-medium">{t('casesResolved')}</th>
                    <th className="pb-3 font-medium">{t('avgTime')}</th>
                    <th className="pb-3 font-medium">{t('satisfaction')}</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { name: 'Sarah Chen', cases: 156, time: '2.8h', satisfaction: '98%' },
                    { name: 'Mike Johnson', cases: 142, time: '3.1h', satisfaction: '96%' },
                    { name: 'Emily Wong', cases: 138, time: '2.9h', satisfaction: '97%' },
                    { name: 'David Kim', cases: 131, time: '3.4h', satisfaction: '95%' },
                    { name: 'Lisa Park', cases: 128, time: '3.0h', satisfaction: '96%' },
                  ].map((agent, index) => (
                    <tr key={index} className="border-b border-slate-50">
                      <td className="py-3 font-medium text-slate-900">{agent.name}</td>
                      <td className="py-3 text-slate-600">{agent.cases}</td>
                      <td className="py-3 text-slate-600">{agent.time}</td>
                      <td className="py-3">
                        <span className="text-green-600 font-medium">{agent.satisfaction}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
