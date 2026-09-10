import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-card border border-dark-border p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
        <p className="font-semibold text-slate-300">{payload[0].payload.name}</p>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Total:</span>
          <span className="font-bold text-white">
            {Number(payload[0].value).toLocaleString()}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const BAR_COLORS = [
  '#38bdf8', // sky
  '#5472f3', // brand
  '#818cf8', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#34d399', // emerald
  '#f59e0b', // amber
  '#64748b', // slate
];

export const BarChartCard = ({ chart }) => {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  return (
    <ChartErrorBoundary title={chart.title}>
      <div className="glass-card rounded-2xl p-5 border border-dark-border flex flex-col justify-between shadow-xl space-y-4 min-h-[360px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Category Comparison</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {chart.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {chart.subtitle || 'Ranked distribution across top categories'}
            </p>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-dark-bg border border-dark-border text-[10px] font-semibold text-slate-400 flex items-center space-x-1 flex-shrink-0">
            <Info className="w-3 h-3 text-emerald-400" />
            <span>Bar Chart</span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-[260px] min-h-[260px] pt-2">
          <ResponsiveContainer width="100%" height={260} minHeight={260}>
            <BarChart data={chart.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                tickFormatter={(v) => (String(v).length > 10 ? `${String(v).slice(0, 8)}...` : v)}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chart.data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartErrorBoundary>
  );
};
