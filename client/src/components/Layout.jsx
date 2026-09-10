import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

/**
 * Main Layout wrapper component
 * Provides persistent Sidebar and Navbar, and renders nested route views.
 */
export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col antialiased">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Navbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
