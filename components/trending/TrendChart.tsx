'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendChartData {
  date: string; // YYYY-MM-DD format
  count: number;
}

export interface TrendChartProps {
  data: TrendChartData[];
  title?: string;
  height?: number;
  width?: number;
  showLabels?: boolean;
  showBaseline?: boolean;
  baselineDays?: number; // Number of days from the start to mark as baseline
  color?: 'blue' | 'orange' | 'green' | 'red' | 'slate';
  className?: string;
}

const colorConfig = {
  blue: {
    line: 'stroke-blue-500',
    fill: 'fill-blue-500/20',
    dot: 'fill-blue-500',
    gradient: { start: 'rgb(59, 130, 246)', end: 'rgb(59, 130, 246, 0.05)' },
  },
  orange: {
    line: 'stroke-orange-500',
    fill: 'fill-orange-500/20',
    dot: 'fill-orange-500',
    gradient: { start: 'rgb(249, 115, 22)', end: 'rgb(249, 115, 22, 0.05)' },
  },
  green: {
    line: 'stroke-green-500',
    fill: 'fill-green-500/20',
    dot: 'fill-green-500',
    gradient: { start: 'rgb(34, 197, 94)', end: 'rgb(34, 197, 94, 0.05)' },
  },
  red: {
    line: 'stroke-red-500',
    fill: 'fill-red-500/20',
    dot: 'fill-red-500',
    gradient: { start: 'rgb(239, 68, 68)', end: 'rgb(239, 68, 68, 0.05)' },
  },
  slate: {
    line: 'stroke-slate-500',
    fill: 'fill-slate-500/20',
    dot: 'fill-slate-500',
    gradient: { start: 'rgb(100, 116, 139)', end: 'rgb(100, 116, 139, 0.05)' },
  },
};

export function TrendChart({
  data,
  title,
  height = 120,
  width = 400,
  showLabels = true,
  showBaseline = false,
  baselineDays = 7,
  color = 'blue',
  className,
}: TrendChartProps) {
  const colors = colorConfig[color];
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { points, minValue, maxValue, trend, baselineX } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], minValue: 0, maxValue: 0, trend: 'flat' as const, baselineX: 0 };
    }

    const values = data.map((d) => d.count);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const pts = data.map((d, index) => {
      const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((d.count - min) / range) * chartHeight;
      return { x, y, ...d };
    });

    // Calculate trend from recent data
    const recentCount = Math.min(3, data.length);
    if (recentCount >= 2) {
      const recent = data.slice(-recentCount);
      const first = recent[0].count;
      const last = recent[recent.length - 1].count;
      const change = ((last - first) / (first || 1)) * 100;
      const trendDirection = change > 10 ? 'up' : change < -10 ? 'down' : 'flat';

      // Calculate baseline separator position
      const blX = showBaseline && baselineDays < data.length
        ? padding.left + (baselineDays / (data.length - 1 || 1)) * chartWidth
        : 0;

      return { points: pts, minValue: min, maxValue: max, trend: trendDirection as 'up' | 'down' | 'flat', baselineX: blX };
    }

    return { points: pts, minValue: min, maxValue: max, trend: 'flat' as const, baselineX: 0 };
  }, [data, chartWidth, chartHeight, padding.left, padding.top, showBaseline, baselineDays]);

  if (data.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-50 rounded-lg',
          className
        )}
        style={{ height, width }}
      >
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  // Create line path
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Create area path
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-green-600' : 'text-slate-500';

  // Y-axis tick values
  const yTicks = [minValue, Math.round((minValue + maxValue) / 2), maxValue];

  // X-axis label positions (first, middle, last)
  const xLabels = [
    { index: 0, label: data[0]?.date ? formatDateLabel(data[0].date) : '' },
    { index: Math.floor(data.length / 2), label: data[Math.floor(data.length / 2)]?.date ? formatDateLabel(data[Math.floor(data.length / 2)].date) : '' },
    { index: data.length - 1, label: data[data.length - 1]?.date ? formatDateLabel(data[data.length - 1].date) : '' },
  ];

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 p-4', className)}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-700">{title}</h4>
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs font-medium">
              {trend === 'up' ? 'Rising' : trend === 'down' ? 'Declining' : 'Stable'}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={colors.gradient.start} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.gradient.end} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis */}
        {showLabels && (
          <>
            {yTicks.map((tick, i) => {
              const y = padding.top + chartHeight - ((tick - minValue) / (maxValue - minValue || 1)) * chartHeight;
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    className="stroke-slate-100"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-slate-400 text-[10px]"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* Baseline separator */}
        {showBaseline && baselineX > 0 && (
          <>
            <rect
              x={padding.left}
              y={padding.top}
              width={baselineX - padding.left}
              height={chartHeight}
              fill="rgba(100, 116, 139, 0.05)"
            />
            <line
              x1={baselineX}
              y1={padding.top}
              x2={baselineX}
              y2={padding.top + chartHeight}
              className="stroke-slate-300"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left + (baselineX - padding.left) / 2}
              y={padding.top + 12}
              textAnchor="middle"
              className="fill-slate-400 text-[9px]"
            >
              Baseline
            </text>
            <text
              x={baselineX + (width - padding.right - baselineX) / 2}
              y={padding.top + 12}
              textAnchor="middle"
              className="fill-slate-500 text-[9px] font-medium"
            >
              Current
            </text>
          </>
        )}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#gradient-${color})`} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          className={colors.line}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 4 : 2}
            className={index === points.length - 1 ? colors.dot : 'fill-slate-300'}
          />
        ))}

        {/* X-axis labels */}
        {showLabels && (
          <>
            {xLabels.map(({ index, label }) => {
              const point = points[index];
              if (!point) return null;
              return (
                <text
                  key={index}
                  x={point.x}
                  y={height - 8}
                  textAnchor={index === 0 ? 'start' : index === data.length - 1 ? 'end' : 'middle'}
                  className="fill-slate-400 text-[10px]"
                >
                  {label}
                </text>
              );
            })}
          </>
        )}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500">
          {data.length} days
        </span>
        <span className="text-xs text-slate-500">
          Peak: <span className="font-medium text-slate-700">{maxValue}</span> cases
        </span>
      </div>
    </div>
  );
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Mini inline trend chart for use in cards or tables
 */
export interface TrendChartMiniProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'blue' | 'orange' | 'green' | 'red' | 'slate';
  showDots?: boolean;
  className?: string;
}

export function TrendChartMini({
  data,
  width = 80,
  height = 24,
  color = 'blue',
  showDots = false,
  className,
}: TrendChartMiniProps) {
  const colors = colorConfig[color];
  const padding = 2;

  if (data.length < 2) {
    return null;
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
    >
      <path
        d={linePath}
        fill="none"
        className={colors.line}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2"
          className={colors.dot}
        />
      )}
    </svg>
  );
}
