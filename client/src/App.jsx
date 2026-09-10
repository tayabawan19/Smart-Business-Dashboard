import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Datasets } from './pages/Datasets';

export default function App() {
  return (
    <AuthProvider>
      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111827',
            color: '#F1F5F9',
            border: '1px solid #1E293B',
            fontSize: '13px',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#111827',
            },
          },
          error: {
            iconTheme: {
              primary: '#F43F5E',
              secondary: '#111827',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Dashboard & App Routes wrapped in Layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/datasets" element={<Datasets />} />
        </Route>

        {/* Root and Fallback Navigation */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
