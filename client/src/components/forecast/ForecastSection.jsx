import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';
import { LineChartCard } from '../charts/LineChartCard';

export const ForecastSection = ({
  forecastData,
  loading,
  refreshing,
  error,
  isCached,
  onRefresh,
}) => {
  // 1. Loading State
  if (loading && !forecastData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-md bg-purple-500/20 animate-pulse" />
            <div className="w-48 h-4 bg-dark-card/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 border border-dark-border h-28 animate-pulse bg-dark-card/40"
            />
          ))}
        </div>
        <div className="glass-card rounded-2xl p-6 border border-dark-border h-80 animate-pulse bg-dark-card/40" />
      </div>
    );
  }

  // 2. Error State (e.g., Python service 503 down)
  if (error) {
    const errStr = String(error || '').toLowerCase();
    const isUnavailable = errStr.includes('503') || errStr.includes('unavailable');

    return (
      <div className="glass-card rounded-2xl p-8 border border-purple-500/30 text-center space-y-4 max-w-2xl mx-auto shadow-xl">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Forecast Microservice Temporarily Unavailable</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">
            {isUnavailable
              ? 'The Python forecasting microservice on port 8000 could not be reached. Ensure the service is active to project future trajectories.'
              : String(error)}
          </p>
        </div>
        <button
          onClick={() => onRefresh && onRefresh(true)}
          disabled={refreshing}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-glow"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Retry Forecast</span>
        </button>
      </div>
    );
  }

  // 3. Fallback: Cannot Forecast (e.g. fewer than 5 periods, or no date column)
  if (!forecastData || forecastData.canForecast === false) {
    const msg = String(forecastData?.message || '').toLowerCase();
    const isDateMissing = msg.includes('date');
    const isFewPeriods = msg.includes('at least 5') || msg.includes('not enough') || msg.includes('sparse');

    return (
      <div className="glass-card rounded-2xl p-7 border border-dark-border space-y-4">
        <div className="flex items-center justify-between border-b border-dark-border/60 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Predictive Trend Forecast</span>
                <span className="text-[10px] font-semibold text-slate-400 bg-dark-bg border border-dark-border px-2 py-0.5 rounded-full">
                  Phase 6
                </span>
              </h3>
              <p className="text-xs text-slate-400">Near-future estimate based on historical patterns</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-bg/60 border border-amber-500/30 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            {isDateMissing ? <Calendar className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
          </div>
          <div className="space-y-1 max-w-lg mx-auto">
            <h4 className="text-sm font-bold text-white">
              {isDateMissing
                ? 'Date Column Required for Forecasting'
                : isFewPeriods
                ? 'Insufficient Historical Data to Forecast'
                : 'Forecast Unavailable'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {forecastData?.message ||
                'Forecasting requires chronological data with at least 5 time periods to produce an explainable trend without guessing.'}
            </p>
          </div>
          <div className="pt-1">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>We avoid low-confidence guesses when data is too sparse.</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Valid Forecast View
  const {
    numericColumn,
    granularity,
    historicalCount,
    periods = [],
    confidenceRange = [],
    trend = 'stable',
    growthRatePercent = 0,
    nextProjectedValue,
    lastActualValue,
    explanation,
    explanationProvider,
  } = forecastData;

  const nextPeriod = periods[0] || 'Next Period';
  const firstRange = confidenceRange[0] || {};
  const isUp = trend === 'upward';
  const isDown = trend === 'downward';
  const TrendIcon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Predictive Metric Forecast
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                Linear Trend Model
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Projecting {periods.length} {granularity} periods forward for <span className="font-semibold text-slate-300">{numericColumn}</span> based on {historicalCount} historical periods
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          {isCached && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Instant Cache Active</span>
            </span>
          )}

          <button
            onClick={() => onRefresh && onRefresh(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-xl bg-dark-bg border border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Recalculate forecast"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* UX Honesty Banner Note */}
      <div className="rounded-2xl p-3.5 bg-gradient-to-r from-purple-950/40 via-dark-card to-dark-card border border-purple-500/30 flex items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs text-purple-200/90 leading-relaxed">
            <span className="font-bold text-purple-200">Honest Estimate Notice:</span> Forecasts are based on historical mathematical trends and are <strong className="text-white underline decoration-purple-400/60">estimates only, not guarantees</strong>. Future business conditions may vary.
          </p>
        </div>
        <span className="hidden md:inline-block text-[10px] uppercase font-bold text-purple-400/80 tracking-wider px-2 py-0.5 bg-purple-500/10 rounded-md border border-purple-500/20 flex-shrink-0">
          Linear Extrapolation
        </span>
      </div>

      {/* 4 Forecast Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Next Period Projected */}
        <div className="glass-card rounded-2xl p-5 border border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Projected {nextPeriod}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Estimate
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight">
              ~{nextProjectedValue != null ? Number(nextProjectedValue).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
            </div>
            <p className="text-[11px] text-purple-300 mt-1 flex items-center space-x-1">
              <span>Approximate value for next {granularity}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Projected Momentum */}
        <div className="glass-card rounded-2xl p-5 border border-dark-border bg-dark-card/60 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Trend Trajectory</span>
            <div
              className={`p-1 rounded-lg ${
                isUp
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isDown
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
              }`}
            >
              <TrendIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white tracking-tight capitalize flex items-center space-x-2">
              <span>{trend}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Estimated {growthRatePercent > 0 ? '+' : ''}{growthRatePercent}% change per {granularity}
            </p>
          </div>
        </div>

        {/* Card 3: Estimated Confidence Range */}
        <div className="glass-card rounded-2xl p-5 border border-dark-border bg-dark-card/60 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Estimated Range (±)</span>
            <span className="text-[10px] font-semibold text-slate-400">95% Interval</span>
          </div>
          <div>
            <div className="text-base font-extrabold text-white font-mono tracking-tight">
              {firstRange.lower != null && firstRange.upper != null
                ? `${Number(firstRange.lower).toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${Number(firstRange.upper).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Expected bounds for {nextPeriod}
            </p>
          </div>
        </div>

        {/* Card 4: Historical Baseline */}
        <div className="glass-card rounded-2xl p-5 border border-dark-border bg-dark-card/60 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Last Actual Baseline</span>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Actual
            </span>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-200 tracking-tight">
              {lastActualValue != null ? Number(lastActualValue).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Most recent historical record
            </p>
          </div>
        </div>
      </div>

      {/* The Visual Chart with Historical Line + Projected Dashed Line + Confidence Band */}
      <LineChartCard forecast={forecastData} />

      {/* AI Plain-English Explanation Card */}
      {explanation && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/60 via-dark-card to-dark-card border border-purple-500/30 p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center flex-shrink-0 shadow-glow">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  AI Trend Forecast Explanation
                </h4>
                {explanationProvider && (
                  <span className="text-[10px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-dark-bg border border-dark-border">
                    {explanationProvider.toUpperCase()} Engine
                  </span>
                )}
              </div>

              <p className="text-sm font-medium text-slate-100 leading-relaxed pt-1">
                "{explanation}"
              </p>

              <p className="text-[11px] text-slate-400 pt-1 italic">
                * Note: This explanation highlights the statistical momentum of your uploaded records and should be combined with qualitative business judgment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
