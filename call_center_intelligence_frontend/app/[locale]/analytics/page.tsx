import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Target, ArrowUp, ArrowDown } from 'lucide-react';

export default async function AnalyticsPage() {
  const t = await getTranslations('pages.analytics');

  const metrics = [
    {
      label: 'Total Cases',
      value: '2,847',
      change: '+12.5%',
      trend: 'up',
      icon: MessageSquare,
    },
    {
      label: 'Avg. Resolution Time',
      value: '4.2h',
      change: '-8.3%',
      trend: 'down',
      icon: Clock,
    },
    {
      label: 'Customer Satisfaction',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      icon: Target,
    },
    {
      label: 'Active Agents',
      value: '127',
      change: '+5',
      trend: 'up',
      icon: Users,
    },
  ];

  return (
    <>
      <Header title={t('title')} />
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend === 'up' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      {metric.change}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{metric.label}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('casesOverTime')}
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <div className="text-center text-slate-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('chartPlaceholder')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('trendingCategories')}
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg">
                <div className="text-center text-slate-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('chartPlaceholder')}</p>
                </div>
              </div>
            </div>
          </div>

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
