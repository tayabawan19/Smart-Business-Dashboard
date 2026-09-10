import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  Bell,
  Search,
  Activity,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';

export const Navbar = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [serverHealth, setServerHealth] = useState({ status: 'checking' });
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Health check ping to backend
    const checkServer = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/health`);
        if (res.ok) {
          const data = await res.json();
          setServerHealth({ status: 'online', data });
        } else {
          setServerHealth({ status: 'offline' });
        }
      } catch (err) {
        setServerHealth({ status: 'offline' });
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const userInitial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="h-16 bg-dark-card/90 backdrop-blur-md border-b border-dark-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Left section: mobile hamburger & breadcrumb */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-dark-hover rounded-lg transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-400">
          <span className="text-slate-500">Platform</span>
          <span>/</span>
          <span className="text-brand-400 font-semibold">Overview</span>
        </div>
      </div>

      {/* Center Search Bar Placeholder */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search metrics, reports, or queries..."
            className="w-full bg-dark-bg/80 border border-dark-border text-sm text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            disabled
          />
        </div>
      </div>

      {/* Right Section: Backend Status, Notifications, User Profile & Logout */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Backend Health Badge */}
        <div
          title={
            serverHealth.status === 'online'
              ? 'Backend API Connected (http://localhost:5000)'
              : 'Backend API Offline or not reachable'
          }
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-dark-bg/60 border-dark-border text-slate-300"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              serverHealth.status === 'online'
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] text-slate-400">API:</span>
          <span
            className={`text-[11px] font-medium ${
              serverHealth.status === 'online' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {serverHealth.status === 'online' ? 'Ready' : 'Standby'}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-dark-hover rounded-lg transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full"></span>
        </button>

        {/* User Account Info */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-dark-border">
          {currentUser?.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-brand-500/40 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              {userInitial}
            </div>
          )}

          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 max-w-[140px] truncate">
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Business User'}
            </span>
            <span className="text-[10px] text-slate-400 max-w-[140px] truncate">
              {currentUser?.email}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-500/20 transition-all ml-1"
            title="Log out of session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
