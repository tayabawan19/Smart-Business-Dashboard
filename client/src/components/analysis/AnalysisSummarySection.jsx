import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Award,
  ArrowDownCircle,
  Activity,
  GitCommit,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  BarChart2,
  Table,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';

/**
 * Format helper for numbers and currencies
 */
const formatValue = (val) => {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(2);
};

export const AnalysisSummarySection = ({
  analysisData,
  loading,
  error,
  isCached,
  durationMs,
  onRefetch,
}) => {
  const [activePerformerTab, setActivePerformerTab] = useState('top');
  const [selectedPerformerPairIndex, setSelectedPerformerPairIndex] = useState(0);

  // 1. Loading State Skeleton
  if (loading) {
    return (
      <div className="space-y-6 pt-6 border-t border-dark-border/60">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-64 bg-dark-card/60 rounded animate-pulse" />
            <div className="h-3 w-96 bg-dark-card/40 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-dark-border h-36 animate-pulse bg-dark-card/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 border border-dark-border h-64 animate-pulse bg-dark-card/50" />
          <div className="glass-card rounded-2xl p-6 border border-dark-border h-64 animate-pulse bg-dark-card/50" />
        </div>
      </div>
    );
  }

  // 2. Service Unavailable or Error Fallback (graceful, does not break dashboard)
  if (error) {
    return (
      <div className="pt-6 border-t border-dark-border/60">
        <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-bold text-white">Statistical Analysis Temporarily Unavailable</h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Microservice Offline
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {error.includes('unavailable') || error.includes('Failed to fetch')
                  ? 'The Python analysis microservice (port 8000) is currently stopped or unreachable. Charts and KPIs above remain fully operational.'
                  : error}
              </p>
            </div>
          </div>
          <button
            onClick={onRefetch}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-dark-bg hover:bg-dark-hover border border-dark-border text-slate-200 text-xs font-semibold rounded-xl transition-all shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Analysis</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. No Analysis Data
  if (!analysisData) {
    return null;
  }

  const { summary, statistics, trends, performers, outliers, correlations } = analysisData;
  const currentPerformerGroup = performers && performers.length > 0 ? performers[selectedPerformerPairIndex] : null;

  return (
    <div className="space-y-8 pt-8 border-t border-dark-border/60">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <span>Statistical Analysis & Key Insights</span>
            </h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              Phase 4 Python Microservice
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Algorithmic breakdown of trends, outlier anomalies, top performers, and feature correlations.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {isCached ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Cached Result</span>
            </span>
          ) : durationMs ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-dark-border text-slate-300 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Analyzed in {durationMs}ms</span>
            </span>
          ) : null}

          <button
            onClick={onRefetch}
            className="p-2 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white hover:bg-dark-hover transition-colors"
            title="Re-run statistical analysis"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Trend Analysis Cards */}
      {trends && trends.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-brand-400" />
            <span>Period-Over-Period Trend Trajectories ({trends.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.map((t, idx) => {
              const isIncreasing = t.trend === 'increasing';
              const isDecreasing = t.trend === 'decreasing';

              const TrendIcon = isIncreasing ? TrendingUp : isDecreasing ? TrendingDown : Minus;
              const badgeBg = isIncreasing
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : isDecreasing
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-slate-500/10 border-slate-500/30 text-slate-400';

              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl p-5 border border-dark-border bg-dark-card/50 hover:border-brand-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {t.period} Trend • {t.dateColumn}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{t.numericColumn}</h4>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex items-center space-x-1 ${badgeBg}`}>
                      <TrendIcon className="w-3 h-3" />
                      <span>{t.trend}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-dark-border/50 my-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Overall Change</span>
                      <span
                        className={`text-base font-extrabold ${
                          t.totalChangePercent > 0
                            ? 'text-emerald-400'
                            : t.totalChangePercent < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {t.totalChangePercent > 0 ? '+' : ''}
                        {t.totalChangePercent}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Latest Period</span>
                      <span
                        className={`text-base font-extrabold ${
                          t.latestPeriodChangePercent > 0
                            ? 'text-emerald-400'
                            : t.latestPeriodChangePercent < 0
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {t.latestPeriodChangePercent > 0 ? '+' : ''}
                        {t.latestPeriodChangePercent}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Latest: <strong className="text-slate-200">{formatValue(t.latestValue)}</strong></span>
                    <span>Avg Growth: <strong className="text-slate-200">{t.averageGrowthRate}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Top & Bottom Performers */}
      {performers && performers.length > 0 && currentPerformerGroup && (
        <div className="glass-card rounded-2xl p-6 border border-dark-border bg-dark-card/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Performance Rankings: {currentPerformerGroup.categoryColumn} by {currentPerformerGroup.numericColumn}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentPerformerGroup.totalCategories} categories analyzed • Total: {formatValue(currentPerformerGroup.totalMetricValue)}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {performers.length > 1 && (
                <select
                  value={selectedPerformerPairIndex}
                  onChange={(e) => setSelectedPerformerPairIndex(Number(e.target.value))}
                  className="bg-dark-bg border border-dark-border text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {performers.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.categoryColumn} → {p.numericColumn}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center p-0.5 rounded-lg bg-dark-bg border border-dark-border">
                <button
                  onClick={() => setActivePerformerTab('top')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activePerformerTab === 'top'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Top 5 Leaders
                </button>
                <button
                  onClick={() => setActivePerformerTab('bottom')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    activePerformerTab === 'bottom'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bottom 5 Laggards
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(activePerformerTab === 'top'
              ? currentPerformerGroup.topPerformers
              : currentPerformerGroup.bottomPerformers
            ).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/60 border border-dark-border hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1 pr-4">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                      activePerformerTab === 'top'
                        ? idx === 0
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white truncate">{item.category}</span>
                      <span className="text-xs font-extrabold text-slate-200">
                        {formatValue(item.totalValue)}
                      </span>
                    </div>
                    {/* Share Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          activePerformerTab === 'top'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                            : 'bg-gradient-to-r from-rose-500 to-rose-300'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(item.sharePercent, 3))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-300">{item.sharePercent}%</span>
                  <span className="text-[10px] text-slate-500 block">of metric</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Outlier Detection Flags & Correlation Check (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outlier Flags */}
        <div className="glass-card rounded-2xl p-6 border border-dark-border bg-dark-card/40 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Outlier Anomalies (IQR Rule)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {summary?.totalOutliersDetected || 0} Flagged
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Data points falling outside 1.5× Interquartile Range, representing potential spikes or input errors.
            </p>

            {outliers && outliers.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {outliers.flatMap((colReport) =>
                  colReport.topOutliers.map((o, idx) => (
                    <div
                      key={`${colReport.column}-${idx}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-dark-bg/60 border border-dark-border text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            o.boundary === 'high' ? 'bg-rose-400' : 'bg-amber-400'
                          }`}
                        />
                        <div>
                          <span className="font-bold text-slate-200">{colReport.column}</span>
                          <span className="text-[10px] text-slate-400 block">
                            Row #{o.rowIndex} • Limit: {formatValue(o.threshold)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-rose-400">{formatValue(o.value)}</span>
                        <span className="text-[10px] text-slate-500 block">
                          +{formatValue(o.distanceFromBoundary)} diff
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-dark-bg/40 border border-dark-border text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-300">Clean Distribution</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No statistical outliers detected in numeric fields.</p>
              </div>
            )}
          </div>
        </div>

        {/* Correlation Matrix & Insights */}
        <div className="glass-card rounded-2xl p-6 border border-dark-border bg-dark-card/40 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-brand-400" />
                <span>Feature Correlations (Pearson r)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                {correlations?.length || 0} Pairs
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Identifies how metrics co-vary. Strong correlations guide predictive models in Phase 5.
            </p>

            {correlations && correlations.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {correlations.map((c, idx) => {
                  const isPositive = c.correlation > 0;
                  const isStrong = Math.abs(c.correlation) >= 0.7;
                  const isModerate = Math.abs(c.correlation) >= 0.4 && !isStrong;

                  const badgeClass = isStrong
                    ? isPositive
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : isModerate
                    ? 'bg-brand-500/15 border-brand-500/30 text-brand-400'
                    : 'bg-slate-700/30 border-slate-600/30 text-slate-400';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-dark-bg/60 border border-dark-border space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {c.columnA} <span className="text-slate-500">↔</span> {c.columnB}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${badgeClass}`}>
                          r = {c.correlation > 0 ? `+${c.correlation}` : c.correlation} ({c.strength})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        {c.insight}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-dark-bg/40 border border-dark-border text-center">
                <p className="text-xs text-slate-400">
                  Multiple numeric columns are required to calculate cross-metric correlations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Comprehensive Numeric Distribution Summary Table */}
      {statistics && statistics.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-dark-border bg-dark-card/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Table className="w-4 h-4 text-emerald-400" />
                <span>Descriptive Statistical Distributions</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Central tendencies, standard deviation, and range limits for all numeric metrics.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-dark-bg/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-dark-border">
                <tr>
                  <th className="py-3 px-4">Metric Column</th>
                  <th className="py-3 px-3 text-right">Count</th>
                  <th className="py-3 px-3 text-right">Sum</th>
                  <th className="py-3 px-3 text-right">Mean (Avg)</th>
                  <th className="py-3 px-3 text-right">Median</th>
                  <th className="py-3 px-3 text-right">Min</th>
                  <th className="py-3 px-3 text-right">Max</th>
                  <th className="py-3 px-3 text-right">Std Dev</th>
                  <th className="py-3 px-3 text-right">IQR (Q3-Q1)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 font-mono">
                {statistics.map((s, idx) => (
                  <tr key={idx} className="hover:bg-dark-hover/50 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white">{s.column}</td>
                    <td className="py-3 px-3 text-right">{s.count.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right font-semibold text-brand-300">{formatValue(s.sum)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-300">{formatValue(s.mean)}</td>
                    <td className="py-3 px-3 text-right">{formatValue(s.median)}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{formatValue(s.min)}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{formatValue(s.max)}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{formatValue(s.stdDev)}</td>
                    <td className="py-3 px-3 text-right text-indigo-300">
                      {s.q75 !== null && s.q25 !== null ? formatValue(s.q75 - s.q25) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
