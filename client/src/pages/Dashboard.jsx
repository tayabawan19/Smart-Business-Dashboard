import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useDatasetCharts } from '../hooks/useDatasetCharts';
import { useDatasetAnalysis } from '../hooks/useDatasetAnalysis';
import { useDatasetInsights } from '../hooks/useDatasetInsights';
import { useDatasetForecast } from '../hooks/useDatasetForecast';
import { KpiCard } from '../components/charts/KpiCard';
import { LineChartCard } from '../components/charts/LineChartCard';
import { BarChartCard } from '../components/charts/BarChartCard';
import { PieChartCard } from '../components/charts/PieChartCard';
import { AnalysisSummarySection } from '../components/analysis/AnalysisSummarySection';
import { AiInsightCardsSection } from '../components/insights/AiInsightCardsSection';
import { ForecastSection } from '../components/forecast/ForecastSection';
import { ChatDrawer } from '../components/chat/ChatDrawer';
import {
  Sparkles,
  UploadCloud,
  LineChart,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Database,
  Layers,
  ChevronDown,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Zap,
  MessageSquare,
  Bot,
} from 'lucide-react';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams(); // In case accessed via /datasets/:id/dashboard
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const userEmail = currentUser?.email || 'user@example.com';

  // Load datasets list
  useEffect(() => {
    let isMounted = true;
    const loadDatasets = async () => {
      try {
        console.log('[Dashboard] Fetching user datasets...');
        setLoadingDatasets(true);
        const res = await api.getDatasets();
        const list = res.datasets || [];
        console.log(`[Dashboard] User datasets found: ${list.length}`);
        
        if (!isMounted) return;
        setDatasets(list);

        // Priority 1: route param :id
        // Priority 2: query param ?datasetId=...
        // Priority 3: first dataset in list
        const requestedId = routeParams.id || searchParams.get('datasetId');
        if (requestedId && list.some((d) => d._id === requestedId)) {
          console.log(`[Dashboard] Setting selectedDatasetId to requestedId: ${requestedId}`);
          setSelectedDatasetId(requestedId);
        } else if (list.length > 0) {
          console.log(`[Dashboard] Setting selectedDatasetId to first dataset: ${list[0]._id} (${list[0].fileName})`);
          setSelectedDatasetId(list[0]._id);
        } else {
          console.log('[Dashboard] No datasets found for user.');
          setSelectedDatasetId('');
        }
      } catch (err) {
        console.error('[Dashboard] Error loading datasets:', err);
      } finally {
        if (isMounted) setLoadingDatasets(false);
      }
    };

    loadDatasets();
    return () => {
      isMounted = false;
    };
  }, [routeParams.id, searchParams]);

  // Handle dropdown selection
  const handleDatasetChange = (e) => {
    const newId = e.target.value;
    console.log(`[Dashboard] Dataset dropdown changed to: ${newId}`);
    setSelectedDatasetId(newId);
    setSearchParams({ datasetId: newId });
  };

  // Custom hook to fetch charts for the selected dataset
  const { chartData, loading: loadingCharts, error: chartError, isCached, refetch } =
    useDatasetCharts(selectedDatasetId);

  // Custom hook to fetch deep statistical analysis from Python microservice (Phase 4)
  const {
    analysisData,
    loading: loadingAnalysis,
    error: analysisError,
    isCached: isAnalysisCached,
    durationMs: analysisDuration,
    refetch: refetchAnalysis,
  } = useDatasetAnalysis(selectedDatasetId);

  // Custom hook to fetch plain-English AI business insights (Phase 5)
  const {
    insights: aiInsights,
    loading: loadingInsights,
    refreshing: refreshingInsights,
    error: insightsError,
    isCached: isInsightsCached,
    provider: insightsProvider,
    mode: insightsMode,
    refetch: refetchInsights,
  } = useDatasetInsights(selectedDatasetId);

  // Custom hook to fetch predictive trend forecast (Phase 6)
  const {
    forecastData,
    loading: loadingForecast,
    refreshing: refreshingForecast,
    error: forecastError,
    isCached: isForecastCached,
    refetch: refetchForecast,
  } = useDatasetForecast(selectedDatasetId);

  const handleRefreshAll = () => {
    refetch();
    refetchAnalysis();
    refetchInsights(true);
    refetchForecast(true);
  };

  const selectedDataset = datasets.find((d) => d._id === selectedDatasetId);

  const phaseCards = [
    {
      phase: 'Phase 1 & 2',
      title: 'Foundation & Ingestion',
      desc: 'Auth, MongoDB, in-memory parsing for CSV & Excel with formula injection defense.',
      status: 'Active',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      phase: 'Phase 3 & 4',
      title: 'Visuals & Python Engine',
      desc: 'Auto-charts, KPIs, trend analysis, top/bottom performers, IQR outliers, and correlations.',
      status: 'Active',
      icon: LineChart,
      color: 'from-brand-500/20 to-brand-500/5',
      borderColor: 'border-brand-500/30',
      badgeColor: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    },
    {
      phase: 'Phase 5 & 6',
      title: 'AI Insights & Forecasts',
      desc: 'Plain-English business narratives, linear trend projections, and honesty-caveated estimates.',
      status: 'Active',
      icon: Sparkles,
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      phase: 'Phase 7',
      title: 'Chat With Your Data',
      desc: 'Natural language Q&A, targeted Python microservice query verification & anti-hallucination defense.',
      status: 'Active',
      icon: MessageSquare,
      color: 'from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/30',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Top Header & Dataset Selector Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-dark-card to-dark-card border border-brand-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>Phase 7: Chat With Your Data Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">{userEmail}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Auto-generated analytics, predictive forecasts, and natural language data chat for your business spreadsheets.
            </p>
          </div>

          {/* Dataset Switcher Dropdown & Action Buttons */}
          {datasets.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative min-w-[220px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Active Dataset
                </label>
                <div className="relative">
                  <select
                    value={selectedDatasetId}
                    onChange={handleDatasetChange}
                    className="w-full appearance-none bg-dark-bg border border-brand-500/30 text-xs font-semibold text-white rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all cursor-pointer"
                  >
                    {datasets.map((d) => (
                      <option key={d._id} value={d._id} className="bg-dark-card text-white">
                        {d.fileName} ({d.rowCount.toLocaleString()} rows)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="self-end sm:self-auto pt-4 sm:pt-4 flex items-center gap-2">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all transform hover:scale-[1.02]"
                  title="Ask questions about this dataset"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat With Data</span>
                </button>

                <button
                  onClick={handleRefreshAll}
                  disabled={loadingCharts || loadingAnalysis}
                  className="p-2.5 rounded-xl bg-dark-bg border border-dark-border text-slate-300 hover:text-white hover:bg-dark-hover transition-colors"
                  title="Re-run Visuals & Statistical Analysis"
                >
                  <RefreshCw className={`w-4 h-4 ${(loadingCharts || loadingAnalysis) ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {loadingDatasets ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-dark-border">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your datasets...</p>
        </div>
      ) : datasets.length === 0 ? (
        /* Empty State: No Datasets Uploaded */
        <div className="glass-card rounded-3xl p-10 sm:p-14 border border-dark-border text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto shadow-glow">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Datasets Ready for Visuals</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Upload a business spreadsheet (.csv, .xlsx) to unlock auto-generated KPI metric cards, time series trends, and category distribution charts.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-glow transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Your First Dataset</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Chart Dashboard Content */
        <div className="space-y-8">
          {/* Active Dataset Meta Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {selectedDataset?.fileName || 'Selected Dataset'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {selectedDataset?.rowCount.toLocaleString()} rows • {selectedDataset?.columnCount} columns
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {isCached && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Instant Cache Active</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsChatOpen(true)}
                className="text-xs font-semibold text-white bg-brand-600/90 hover:bg-brand-500 px-3 py-1.5 rounded-lg border border-brand-500/40 flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-200 animate-pulse" />
                <span>Ask Data AI</span>
              </button>

              <Link
                to="/upload"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded-lg border border-brand-500/20 hover:bg-brand-950/40 transition-colors"
              >
                + Upload Another
              </Link>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loadingCharts || !chartData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-5 border border-dark-border h-32 animate-pulse bg-dark-card/50" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-6 border border-dark-border h-80 animate-pulse bg-dark-card/50" />
                ))}
              </div>
            </div>
          ) : chartError ? (
            /* Error State */
            <div className="glass-card rounded-2xl p-8 border border-rose-500/30 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Failed to Generate Visuals</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">{chartError}</p>
              <button
                onClick={refetch}
                className="px-4 py-2 bg-dark-bg border border-dark-border text-xs font-semibold text-slate-200 rounded-xl hover:bg-dark-hover transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : !chartData.canChart ? (
            /* Fallback: Not enough numeric / categorical data to chart */
            <div className="glass-card rounded-2xl p-8 border border-amber-500/30 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Not Enough Data to Auto-Chart</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {chartData.reason || 'This dataset does not contain sufficient numeric or date values to generate meaningful charts.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-glow transition-all"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload a Numeric Dataset</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* 1. KPI Summary Cards Row */}
              {chartData.kpis && chartData.kpis.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-brand-400" />
                    <span>Executive KPI Summaries</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {chartData.kpis.map((kpi, idx) => (
                      <KpiCard key={kpi.id || idx} kpi={kpi} index={idx} />
                    ))}
                  </div>
                </div>
              )}

              {/* 2. AI Business Insights & Executive Takeaways (Phase 5) */}
              <AiInsightCardsSection
                insights={aiInsights}
                loading={loadingInsights}
                refreshing={refreshingInsights}
                error={insightsError}
                isCached={isInsightsCached}
                provider={insightsProvider}
                mode={insightsMode}
                onRefresh={refetchInsights}
              />

              {/* 3. Auto-Generated Charts Grid */}
              {chartData.charts && chartData.charts.length > 0 ? (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                    <LineChart className="w-4 h-4 text-brand-400" />
                    <span>Auto-Generated Visualizations ({chartData.charts.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {chartData.charts.map((chart) => {
                      if (chart.type === 'line') {
                        return <LineChartCard key={chart.id} chart={chart} />;
                      }
                      if (chart.type === 'bar') {
                        return <BarChartCard key={chart.id} chart={chart} />;
                      }
                      if (chart.type === 'pie') {
                        return <PieChartCard key={chart.id} chart={chart} />;
                      }
                      return null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-2xl p-6 border border-dark-border text-center">
                  <p className="text-xs text-slate-400">
                    No visual charts could be generated for this specific schema, but KPI summaries above are available.
                  </p>
                </div>
              )}

              {/* 4. Predictive Trend Forecast Section (Phase 6) */}
              <ForecastSection
                forecastData={forecastData}
                loading={loadingForecast}
                refreshing={refreshingForecast}
                error={forecastError}
                isCached={isForecastCached}
                onRefresh={refetchForecast}
              />
            </>
          )}

          {/* 5. Statistical Analysis & Key Insights Section (Phase 4 Python Microservice) */}
          <AnalysisSummarySection
            analysisData={analysisData}
            loading={loadingAnalysis}
            error={analysisError}
            isCached={isAnalysisCached}
            durationMs={analysisDuration}
            onRefetch={refetchAnalysis}
          />
        </div>
      )}

      {/* Roadmap Status Section */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Implementation Roadmap</span>
          </h2>
          <span className="text-xs text-brand-400 font-semibold">Phase 7 Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {phaseCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`glass-card rounded-2xl p-5 border ${card.borderColor} bg-gradient-to-b ${card.color} flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-dark-bg/80 border border-white/10 flex items-center justify-center text-slate-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}
                    >
                      {card.status}
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    {card.phase}
                  </span>
                  <h3 className="text-sm font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Chat Action Button */}
      {selectedDatasetId && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-2xl shadow-brand-500/40 border border-white/20 transition-all transform hover:scale-105 active:scale-95 group cursor-pointer"
          >
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <span>Chat With Data</span>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-white/20 rounded-full">
              Phase 7
            </span>
          </button>
        </div>
      )}

      {/* Slide-Over Chat Drawer Component */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        datasetId={selectedDatasetId}
        datasetName={selectedDataset?.fileName}
      />
    </div>
  );
};

