import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileBarChart,
  Settings,
  Sparkles,
  Database,
  TrendingUp,
  X,
} from 'lucide-react';

export const Sidebar = ({ isOpen, closeSidebar }) => {
  const navItems = [
    {
      name: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      active: true,
      badge: null,
    },
    {
      name: 'Upload Data',
      to: '#upload',
      icon: UploadCloud,
      active: false,
      badge: 'Phase 2',
    },
    {
      name: 'Reports',
      to: '#reports',
      icon: FileBarChart,
      active: false,
      badge: 'Phase 3',
    },
    {
      name: 'Settings',
      to: '#settings',
      icon: Settings,
      active: false,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-dark-sidebar border-r border-dark-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-glow">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                SmartBusiness
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-400">
                AI Dashboard
              </span>
            </div>
          </div>

          <button
            onClick={closeSidebar}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-dark-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            if (item.active) {
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-glow'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-dark-hover'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </NavLink>
              );
            }

            // Non-functional links for Phase 1
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-400 hover:bg-dark-hover/50 cursor-not-allowed select-none transition-colors"
                title={`${item.name} will be active in upcoming phases`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-dark-bg border border-dark-border text-slate-400">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Assistant Banner / Phase 1 Status */}
        <div className="p-4 m-4 rounded-2xl bg-gradient-to-b from-brand-950/60 to-dark-card border border-brand-500/20">
          <div className="flex items-center space-x-2 text-brand-400 mb-1.5">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span className="text-xs font-semibold">Phase 1: Active</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Foundation & Auth configured. Ready for dataset upload & ML forecasting in next phase.
          </p>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-dark-border text-center">
          <p className="text-[10px] text-slate-500">
            Smart Business Dashboard v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};
