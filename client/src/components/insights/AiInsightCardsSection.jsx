import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  GitCommit,
  Lightbulb,
  RefreshCw,
  CheckCircle2,
  BrainCircuit,
  Bot,
  Layers,
  ArrowRight,
} from 'lucide-react';

/**
 * Returns icon, accent colors, and styling based on insight type
 */
const getInsightTheme = (type) => {
  switch (type) {
    case 'trend':
      return {
        icon: TrendingUp,
        borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cardBg: 'from-emerald-950/20 via-dark-card to-dark-card',
      };
    case 'performer':
      return {
        icon: Award,
        borderColor: 'border-amber-500/30 hover:border-amber-500/50',
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        cardBg: 'from-amber-950/20 via-dark-card to-dark-card',
      };
    case 'outlier':
      return {
        icon: AlertTriangle,
        borderColor: 'border-rose-500/30 hover:border-rose-500/50',
        badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        cardBg: 'from-rose-950/20 via-dark-card to-dark-card',
      };
    case 'correlation':
      return {
        icon: GitCommit,
        borderColor: 'border-brand-500/30 hover:border-brand-500/50',
        badgeBg: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
        iconBg: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
        cardBg: 'from-brand-950/20 via-dark-card to-dark-card',
      };
    case 'summary':
    default:
      return {
        icon: BrainCircuit,
        borderColor: 'border-purple-500/30 hover:border-purple-500/50',
        badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        cardBg: 'from-purple-950/25 via-dark-card to-dark-card',
      };
  }
};

export const AiInsightCardsSection = ({
  insights,
  loading,
  refreshing,
  error,
  isCached,
  provider,
  mode,
  onRefresh,
}) => {
  // 1. Loading State
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-52 bg-dark-card/80 rounded animate-pulse" />
              <div className="h-3 w-80 bg-dark-card/50 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 border border-dark-border h-48 animate-pulse bg-dark-card/40 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-dark-border/60 rounded" />
                <div className="h-3 w-full bg-dark-border/40 rounded" />
                <div className="h-3 w-5/6 bg-dark-border/40 rounded" />
              </div>
              <div className="h-7 w-full bg-dark-border/30 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error Fallback (graceful, keeps page functional)
  if (error && (!insights || insights.length === 0)) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-purple-500/30 bg-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">AI Insights Temporarily Unavailable</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
              {error}
            </p>
          </div>
        </div>
        <button
          onClick={() => onRefresh(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-slate-200 text-xs font-semibold rounded-xl transition-all shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry AI Insights</span>
        </button>
      </div>
    );
  }

  // 3. No Insights
  if (!insights || insights.length === 0) {
    return null;
  }

  // Separate executive summary from specific finding cards
  const summaryInsight = insights.find((i) => i.type === 'summary');
  const detailedInsights = insights.filter((i) => i.type !== 'summary');

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              AI Business Insights & Executive Takeaways
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
              Phase 5
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Natural language analysis generated from your dataset metrics without technical jargon.
          </p>
        </div>

        {/* Action & Metadata Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {provider && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 border border-dark-border text-slate-300 flex items-center space-x-1 capitalize">
              <Bot className="w-3 h-3 text-purple-400" />
              <span>{provider}</span>
            </span>
          )}

          {isCached && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Instant Cache</span>
            </span>
          )}

          <button
            onClick={() => onRefresh(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Generate fresh AI insights"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Thinking...' : 'Refresh AI'}</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Summary Banner (if present) */}
      {summaryInsight && (
        <div className="relative overflow-hidden rounded-2xl p-5 border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-dark-card to-dark-card shadow-lg">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Executive Briefing
                </span>
                <span className="text-xs text-slate-400">• Metric: {summaryInsight.metric}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {summaryInsight.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {summaryInsight.explanation}
              </p>
            </div>

            {summaryInsight.actionableTip && (
              <div className="p-3.5 rounded-xl bg-dark-bg/80 border border-purple-500/20 text-xs text-slate-300 max-w-sm shrink-0 flex items-start space-x-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Recommended Action</span>
                  <p className="text-[11px] text-slate-300 leading-snug">{summaryInsight.actionableTip}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Grid of Specific Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {detailedInsights.map((insight, idx) => {
          const theme = getInsightTheme(insight.type);
          const Icon = theme.icon;

          return (
            <div
              key={insight.id || idx}
              className={`glass-card rounded-2xl p-5 border ${theme.borderColor} bg-gradient-to-b ${theme.cardBg} flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200 shadow-sm`}
            >
              <div className="space-y-3">
                {/* Header Row: Type Badge + Metric */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${theme.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border capitalize ${theme.badgeBg}`}>
                      {insight.type}
                    </span>
                  </div>

                  {insight.importance === 'high' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      High Impact
                    </span>
                  )}
                </div>

                {/* Title & Plain English Explanation */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {insight.explanation}
                  </p>
                </div>
              </div>

              {/* Actionable Takeaway Footer */}
              {insight.actionableTip && (
                <div className="mt-4 pt-3 border-t border-dark-border/50 flex items-start space-x-2 text-[11px]">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-slate-400 leading-tight">
                    <strong className="text-slate-200">Takeaway:</strong> {insight.actionableTip}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
