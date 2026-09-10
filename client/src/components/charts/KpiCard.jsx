import React from 'react';
import { TrendingUp, Hash, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export const KpiCard = ({ kpi, index = 0 }) => {
  if (!kpi) return null;

  const colorVariants = [
    {
      gradient: 'from-brand-600/20 to-indigo-600/5',
      border: 'border-brand-500/30',
      badge: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
      iconColor: 'text-brand-400',
    },
    {
      gradient: 'from-emerald-600/20 to-teal-600/5',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      gradient: 'from-purple-600/20 to-pink-600/5',
      border: 'border-purple-500/30',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      iconColor: 'text-purple-400',
    },
    {
      gradient: 'from-amber-600/20 to-orange-600/5',
      border: 'border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconColor: 'text-amber-400',
    },
  ];

  const variant = colorVariants[index % colorVariants.length];

  return (
    <div
      className={`glass-card rounded-2xl p-5 border ${variant.border} bg-gradient-to-b ${variant.gradient} flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300 shadow-lg`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider truncate max-w-[150px]">
          {kpi.name}
        </span>
        <div className={`p-1.5 rounded-lg border ${variant.badge}`}>
          <Hash className={`w-3.5 h-3.5 ${variant.iconColor}`} />
        </div>
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {kpi.formattedTotal}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">Total Sum</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 pt-3 border-t border-white/5 text-[11px]">
        <div>
          <span className="text-slate-400 block text-[10px]">Average</span>
          <span className="font-bold text-slate-200">{kpi.formattedAvg}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Min</span>
          <span className="font-bold text-slate-200">{kpi.min.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Max</span>
          <span className="font-bold text-slate-200">{kpi.max.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
