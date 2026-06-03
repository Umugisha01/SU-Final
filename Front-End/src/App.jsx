import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ReportList from './pages/reports/ReportList';
import ReportForm from './pages/reports/ReportForm';
import ReportDetail from './pages/reports/ReportDetail';
import AIAnalysisDashboard from './pages/ai-analysis/AIAnalysisDashboard';
import ConsolidationDashboard from './pages/consolidation/ConsolidationDashboard';
import SupportRequests from './pages/support/SupportRequests';
import SupportForm from './pages/support/SupportForm';
import RegionsDashboard from './pages/regions/RegionsDashboard';
import NotificationCenter from './pages/notifications/NotificationCenter';
import DocumentRepository from './pages/documents/DocumentRepository';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import PrayerRequests from './pages/prayer/PrayerRequests';
import UserManagement from './pages/users/UserManagement';
import SecurityAudit from './pages/security/SecurityAudit';
import Settings from './pages/settings/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{
              style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' },
              success: { iconTheme: { primary: '#2e7d32', secondary: '#fff' } },
            }} />
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected — wrapped in Layout */}
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Reports */}
                <Route path="/reports" element={<ReportList />} />
                <Route path="/reports/new" element={<ReportForm />} />
                <Route path="/reports/:id" element={<ReportDetail />} />
                <Route path="/reports/:id/edit" element={<ReportForm />} />

                {/* Modules */}
                <Route path="/ai-analysis" element={<AIAnalysisDashboard />} />
                <Route path="/consolidation" element={<ConsolidationDashboard />} />
                <Route path="/support" element={<SupportRequests />} />
                <Route path="/support/new" element={<SupportForm />} />
                <Route path="/regions" element={<RegionsDashboard />} />
                <Route path="/notifications" element={<NotificationCenter />} />
                <Route path="/documents" element={<DocumentRepository />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/prayer" element={<PrayerRequests />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/security" element={<SecurityAudit />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
