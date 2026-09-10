import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  UploadCloud,
  LineChart,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Server,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const Dashboard = () => {
  const { currentUser } = useAuth();

  const userEmail = currentUser?.email || 'user@example.com';
  const userName = currentUser?.displayName || userEmail.split('@')[0];

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
      phase: 'Phase 2: Next',
      title: 'Dataset Upload & Parsing',
      desc: 'Upload CSV & Excel business files, data sanitization, schema validation, and MongoDB storage.',
      status: 'Upcoming',
      icon: UploadCloud,
      color: 'from-brand-500/20 to-brand-500/5',
      borderColor: 'border-brand-500/30',
      badgeColor: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
    },
    {
      phase: 'Phase 3',
      title: 'Interactive Analytics & Charts',
      desc: 'Revenue, KPI metrics, dynamic sales charts, breakdown tables, and custom date range filters.',
      status: 'Planned',
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
              Phase 1 foundation is ready. Your authentication session is active, protected routing is verified, and the Express backend is ready to receive datasets in Phase 2.
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-shrink-0">
            <div className="glass-card px-4 py-3 rounded-2xl border border-white/5 flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left">
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">User Status</p>
                <p className="text-xs font-bold text-white capitalize">{currentUser?.isDemo ? 'Demo Mode' : 'Authenticated'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Implementation Roadmap</span>
          </h2>
          <span className="text-xs text-slate-400">Step 1 of 5 Ready</span>
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

      {/* Starter Empty State / Workspace Placeholder */}
      <div className="glass-card rounded-2xl p-8 border border-dark-border text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto">
          <UploadCloud className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold text-white">No Datasets Uploaded Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Data upload and processing pipelines will be activated in Phase 2. Once connected, your sales, revenue, and churn metrics will render here in real-time.
          </p>
        </div>
        <div className="pt-2">
          <button
            disabled
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-dark-bg border border-dark-border text-slate-500 cursor-not-allowed"
          >
            <span>Upload Dataset (Phase 2)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
