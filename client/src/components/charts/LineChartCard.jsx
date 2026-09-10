import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';

// Custom dark theme tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
        <p className="font-semibold text-slate-300">{label}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-brand-400" />
          <span className="text-slate-400">Value:</span>
          <span className="font-bold text-white">
            {Number(payload[0].value).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const LineChartCard = ({ chart }) => {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  const gradientId = `lineGrad_${chart.id || 'default'}`;

  return (
    <ChartErrorBoundary title={chart.title}>
      <div className="glass-card rounded-2xl p-5 border border-dark-border flex flex-col justify-between shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Trend Analysis</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {chart.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {chart.subtitle || 'Chronological trend visualization'}
            </p>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-dark-bg border border-dark-border text-[10px] font-semibold text-slate-400 flex items-center space-x-1">
            <Info className="w-3 h-3 text-brand-400" />
            <span>Time Series</span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5472f3" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#5472f3" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="x"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="y"
                stroke="#5472f3"
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 5, fill: '#818cf8', stroke: '#111827', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartErrorBoundary>
  );
};
