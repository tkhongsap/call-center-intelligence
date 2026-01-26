'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface SparklineData {
  label: string;
  value: number;
}

export interface SparklineProps {
  data: SparklineData[];
  title: string;
  currentValue: number | string;
  showTrend?: boolean;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'slate';
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  title,
  currentValue,
  showTrend = true,
  color = 'blue',
  height = 40,
  className = '',
}: SparklineProps) {
  const colorMap = {
    blue: {
      line: 'stroke-blue-500',
      fill: 'fill-blue-500/10',
      dot: 'fill-blue-500',
      trend: 'text-blue-600',
    },
    green: {
      line: 'stroke-green-500',
      fill: 'fill-green-500/10',
      dot: 'fill-green-500',
      trend: 'text-green-600',
    },
    red: {
      line: 'stroke-red-500',
      fill: 'fill-red-500/10',
      dot: 'fill-red-500',
      trend: 'text-red-600',
    },
    amber: {
      line: 'stroke-amber-500',
      fill: 'fill-amber-500/10',
      dot: 'fill-amber-500',
      trend: 'text-amber-600',
    },
    slate: {
      line: 'stroke-slate-500',
      fill: 'fill-slate-500/10',
      dot: 'fill-slate-500',
      trend: 'text-slate-600',
    },
  };

  const colors = colorMap[color];

  // Calculate trend direction from first to last data point
  const getTrend = () => {
    if (data.length < 2) return 'flat';
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const percentChange = ((last - first) / (first || 1)) * 100;
    if (percentChange > 5) return 'up';
    if (percentChange < -5) return 'down';
    return 'flat';
  };

  const trend = getTrend();

  // Calculate SVG path
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const padding = 4;
  const width = 120;
  const chartHeight = height - padding * 2;

  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y };
  });

  // Create line path
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create area path (for fill under the line)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500';

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-3 ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-lg font-semibold text-slate-900">{currentValue}</p>
        </div>
        {showTrend && (
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs font-medium">
              {trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'Stable'}
            </span>
          </div>
        )}
      </div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Area fill */}
        <path d={areaPath} className={colors.fill} />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          className={colors.line}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Last point dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="3"
            className={colors.dot}
          />
        )}
      </svg>
      {/* Day labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400">
          {data[0]?.label || '7d ago'}
        </span>
        <span className="text-[10px] text-slate-400">
          {data[data.length - 1]?.label || 'Today'}
        </span>
      </div>
    </div>
  );
}

export interface SparklineMiniProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'slate';
  className?: string;
}

export function SparklineMini({
  data,
  width = 60,
  height = 20,
  color = 'blue',
  className = '',
}: SparklineMiniProps) {
  const colorMap = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    red: 'stroke-red-500',
    amber: 'stroke-amber-500',
    slate: 'stroke-slate-500',
  };

  const lineColor = colorMap[color];

  if (data.length < 2) return null;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      <path
        d={points.join(' ')}
        fill="none"
        className={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
