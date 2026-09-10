import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sparkles,
  UploadCloud,
  LineChart,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Database,
  Layers,
  ArrowUpRight,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const [datasetCount, setDatasetCount] = useState(0);
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  const userEmail = currentUser?.email || 'user@example.com';

  useEffect(() => {
    const fetchRecentDatasets = async () => {
      try {
        setLoading(true);
        const res = await api.getDatasets();
        const datasets = res.datasets || [];
        setDatasetCount(datasets.length);
        setRecentDatasets(datasets.slice(0, 3));
      } catch (err) {
        console.warn('Could not fetch datasets for dashboard overview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDatasets();
  }, []);

  const phaseCards = [
    {
      phase: 'Phase 1: Complete',
      title: 'Foundation & Setup',
      desc: 'React (Vite), Tailwind CSS, Firebase Authentication, protected routes & Express server setup.',
      status: 'Active',
      icon: ShieldCheck,
      color: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      phase: 'Phase 2: Complete',
      title: 'Dataset Upload & Parsing',
      desc: 'In-memory parsing (.csv, .xlsx, .xls), formula injection defense, automatic type detection, and MongoDB storage.',
      status: 'Active',
      icon: UploadCloud,
      color: 'from-brand-500/20 to-brand-500/5',
      borderColor: 'border-brand-500/30',
      badgeColor: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    },
    {
      phase: 'Phase 3: Next',
      title: 'Interactive Analytics & Charts',
      desc: 'Revenue, KPI metrics, dynamic sales charts, breakdown tables, and custom date range filters.',
      status: 'Upcoming',
      icon: LineChart,
      color: 'from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/30',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      phase: 'Phase 4 & 5',
      title: 'AI Intelligence & Forecasting',
      desc: 'LLM-driven anomaly detection, natural language data queries, and predictive trend forecasting.',
      status: 'Planned',
      icon: BrainCircuit,
      color: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-dark-card to-dark-card border border-brand-500/20 p-6 sm:p-8 shadow-2xl">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Business Intelligence Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-300">{userEmail}</span>
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Phase 2 File Upload Module is active. Upload your CSV or Excel spreadsheets to parse columns, preview data, and prepare for Phase 3 visual analytics.
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-2xl shadow-glow transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Dataset</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dataset Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Uploaded Datasets
            </p>
            <p className="text-2xl font-extrabold text-white">{datasetCount}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              File Ingestion Engine
            </p>
            <p className="text-sm font-bold text-emerald-400 flex items-center space-x-1">
              <span>CSV & Excel Ready</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-dark-border flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Security & Sanitization
            </p>
            <p className="text-sm font-bold text-brand-400">
              Formula Defense Active
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roadmap & Next Steps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Implementation Roadmap</span>
          </h2>
          <span className="text-xs text-brand-400 font-semibold">Phase 2 Completed</span>
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

      {/* Recent Datasets or Upload CTA */}
      {datasetCount > 0 ? (
        <div className="glass-card rounded-2xl p-6 border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-brand-400" />
              <span>Recent Datasets</span>
            </h3>
            <Link
              to="/datasets"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center space-x-1"
            >
              <span>View all ({datasetCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-dark-border/60">
            {recentDatasets.map((dataset) => (
              <div
                key={dataset._id}
                className="py-3 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{dataset.fileName}</p>
                    <p className="text-[11px] text-slate-400">
                      {dataset.rowCount.toLocaleString()} rows • {dataset.columnCount} columns • {(dataset.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <Link
                  to="/datasets"
                  className="px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border text-slate-300 hover:text-white hover:bg-dark-hover transition-colors"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 border border-dark-border text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto shadow-glow">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">Upload Your First Business Dataset</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Import a CSV or Excel file to preview data, review column schemas, and prepare for Phase 3 charts.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl shadow-glow transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Upload Page</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
