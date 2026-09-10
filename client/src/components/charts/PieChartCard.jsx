import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { PieChart as PieIcon, Info } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';

const PIE_PALETTE = [
  '#5472f3', // brand
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b', // slate
];

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-dark-card border border-dark-border p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
        <p className="font-semibold text-slate-200">{data.name}</p>
        <div className="flex items-center space-x-2 text-slate-400">
          <span>Records:</span>
          <span className="font-bold text-white">{data.value}</span>
          {data.percentage && (
            <span className="text-brand-400 font-semibold">({data.percentage}%)</span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const PieChartCard = ({ chart }) => {
  if (!chart || !chart.data || chart.data.length === 0) return null;

  return (
    <ChartErrorBoundary title={chart.title}>
      <div className="glass-card rounded-2xl p-5 border border-dark-border flex flex-col justify-between shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-400 mb-1">
              <PieIcon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Distribution Breakdown</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {chart.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {chart.subtitle || 'Proportional segment distribution'}
            </p>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-dark-bg border border-dark-border text-[10px] font-semibold text-slate-400 flex items-center space-x-1">
            <Info className="w-3 h-3 text-purple-400" />
            <span>Donut</span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={chart.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
              >
                {chart.data.map((entry, index) => (
                  <Cell
                    key={`pie-cell-${index}`}
                    fill={PIE_PALETTE[index % PIE_PALETTE.length]}
                    stroke="#0B0F19"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-[11px] text-slate-300 font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartErrorBoundary>
  );
};
