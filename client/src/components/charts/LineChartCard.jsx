import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Info, Sparkles, HelpCircle } from 'lucide-react';
import { ChartErrorBoundary } from './ChartErrorBoundary';

// Custom dark theme tooltip handling both standard line and forecast mode
const CustomTooltip = ({ active, payload, label, isForecastMode }) => {
  if (!active || !payload || !payload.length) return null;

  // Check if current hovered point is forecast or historical
  const pointData = payload[0]?.payload;
  const isProjected = pointData?.type === 'forecast' || (pointData?.forecast !== undefined && pointData?.historical === undefined);
  const histVal = pointData?.historical;
  const forecastVal = pointData?.forecast;
  const lower = pointData?.lowerBound;
  const upper = pointData?.upperBound;

  return (
    <div className="bg-dark-card/95 border border-dark-border p-3.5 rounded-xl shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[200px]">
      <div className="flex items-center justify-between border-b border-dark-border/60 pb-1.5 gap-2">
        <p className="font-bold text-slate-200">{label}</p>
        {isForecastMode && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isProjected
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
            }`}
          >
            {isProjected ? 'Projected Estimate' : 'Historical Actual'}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {histVal !== undefined && (
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-400" />
              <span className="text-slate-400">Actual:</span>
            </div>
            <span className="font-bold text-white">
              {Number(histVal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {forecastVal !== undefined && isProjected && (
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-purple-300 font-medium">Projected:</span>
            </div>
            <span className="font-bold text-purple-200">
              ~{Number(forecastVal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {lower !== undefined && upper !== undefined && isProjected && (
          <div className="pt-1 border-t border-dark-border/40 text-[11px] space-y-0.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Est. Range (±):</span>
              <span className="font-mono text-slate-300">
                {Number(lower).toLocaleString(undefined, { maximumFractionDigits: 0 })} – {Number(upper).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-[10px] text-purple-300/80 italic text-right pt-0.5">
              Estimate only, not guaranteed
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const LineChartCard = ({ chart, forecast, title, subtitle }) => {
  const isForecastMode = Boolean(forecast && forecast.canForecast);

  // If standard chart with no data and no forecast, return null
  if (!isForecastMode && (!chart || !chart.data || chart.data.length === 0)) return null;

  const chartTitle = title || (isForecastMode ? `${forecast.numericColumn} Trend & Projection` : chart?.title);
  const chartSubtitle = subtitle || (isForecastMode ? `Historical actuals with ${forecast.periods?.length || 5}-period linear projection` : chart?.subtitle || 'Chronological trend visualization');

  const gradientId = `lineGrad_${chart?.id ? chart.id.replace(/[^a-zA-Z0-9]/g, '_') : 'forecast'}`;
  const bandGradientId = `bandGrad_${chart?.id ? chart.id.replace(/[^a-zA-Z0-9]/g, '_') : 'forecast'}`;

  // Build unified dataset if forecast mode is enabled
  let combinedData = [];
  if (isForecastMode) {
    const historical = forecast.historical || [];
    const futurePeriods = forecast.periods || [];
    const forecastedValues = forecast.forecastedValues || [];
    const confidenceRange = forecast.confidenceRange || [];

    // 1. Add historical actuals
    historical.forEach((item, idx) => {
      const isLastHistorical = idx === historical.length - 1;
      combinedData.push({
        x: item.period,
        historical: item.value,
        // Bridge the forecast line to the last historical point so there's no visual disconnect
        forecast: isLastHistorical ? item.value : undefined,
        type: 'actual',
      });
    });

    // 2. Add projected future points with confidence interval band
    futurePeriods.forEach((period, idx) => {
      const fVal = forecastedValues[idx];
      const range = confidenceRange[idx] || {};
      combinedData.push({
        x: period,
        historical: undefined,
        forecast: fVal,
        lowerBound: range.lower,
        upperBound: range.upper,
        // Recharts Area supports [min, max] range tuple for shaded bands
        confidenceBand: range.lower !== undefined && range.upper !== undefined ? [range.lower, range.upper] : undefined,
        type: 'forecast',
      });
    });
  } else {
    // Standard mode from Phase 3
    combinedData = (chart.data || []).map((d) => ({
      x: d.x,
      historical: d.y,
      type: 'actual',
    }));
  }

  return (
    <ChartErrorBoundary title={chartTitle}>
      <div className="glass-card rounded-2xl p-5 border border-dark-border flex flex-col justify-between shadow-xl space-y-4 min-h-[360px]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-400 mb-1">
              {isForecastMode ? <Sparkles className="w-4 h-4 text-purple-400" /> : <TrendingUp className="w-4 h-4" />}
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isForecastMode ? 'text-purple-400' : 'text-brand-400'}`}>
                {isForecastMode ? 'Predictive Forecast • Linear Model' : 'Trend Analysis'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span>{chartTitle}</span>
              {isForecastMode && (
                <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Estimated Projections
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {chartSubtitle}
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {isForecastMode ? (
              <div
                className="group relative px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-[10px] font-semibold text-purple-300 flex items-center space-x-1 cursor-help"
                title="Forecasts are based on historical trends and are estimates only, not guarantees"
              >
                <HelpCircle className="w-3 h-3 text-purple-400" />
                <span>Estimate Caveat</span>
                {/* Tooltip on hover */}
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-30 w-56 p-2 bg-dark-bg border border-purple-500/40 text-[11px] text-slate-300 rounded-xl shadow-2xl backdrop-blur-md">
                  Forecasts are calculated using a linear trend projection of historical patterns. These are statistical estimates, not guaranteed outcomes.
                </div>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-full bg-dark-bg border border-dark-border text-[10px] font-semibold text-slate-400 flex items-center space-x-1">
                <Info className="w-3 h-3 text-brand-400" />
                <span>Time Series</span>
              </div>
            )}
          </div>
        </div>

        {/* Legend for Forecast Mode */}
        {isForecastMode && (
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 pb-1 border-b border-dark-border/40">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 rounded-full bg-[#5472f3]" />
              <span>Historical Actual</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 rounded-full bg-[#a855f7] border-b border-dashed border-white" />
              <span className="text-purple-300 font-medium">Projected Estimate (Dashed)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-purple-500/20 border border-purple-500/40" />
              <span className="text-slate-400">Confidence Band</span>
            </div>
          </div>
        )}

        {/* Chart Canvas */}
        <div className="w-full h-[260px] min-h-[260px] pt-2">
          <ResponsiveContainer width="100%" height={260} minHeight={260}>
            <ComposedChart data={combinedData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5472f3" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#5472f3" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id={bandGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
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
                tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />

              <Tooltip content={<CustomTooltip isForecastMode={isForecastMode} />} />

              {/* Shaded Confidence Band (Forecast Mode) */}
              {isForecastMode && (
                <Area
                  type="monotone"
                  dataKey="confidenceBand"
                  stroke="#a855f7"
                  strokeDasharray="2 2"
                  strokeOpacity={0.3}
                  fill={`url(#${bandGradientId})`}
                  fillOpacity={1}
                  isAnimationActive={false}
                />
              )}

              {/* Historical Area & Line */}
              <Area
                type="monotone"
                dataKey="historical"
                stroke="#5472f3"
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 5, fill: '#818cf8', stroke: '#111827', strokeWidth: 2 }}
              />

              {/* Forecast Line (Dashed Purple with Distinct Hollow Dots) */}
              {isForecastMode && (
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#c084fc"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#c084fc', stroke: '#0f172a', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#f3e8ff', stroke: '#9333ea', strokeWidth: 2 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Caveat for Honesty */}
        {isForecastMode && (
          <div className="pt-2 border-t border-dark-border/40 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center space-x-1.5 text-purple-300/80">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Model: Linear trend with ±1.96 standard error confidence band</span>
            </span>
            <span className="italic text-slate-500">
              Estimates only, not guarantees
            </span>
          </div>
        )}
      </div>
    </ChartErrorBoundary>
  );
};
