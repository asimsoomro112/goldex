import React from 'react';
import { BrowserRouter, Navigate, Outlet, Routes, Route } from 'react-router-dom';

// Public Layout Components
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Dashboard Layout
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage, CompliancePage, FeesPage, HowItWorksPage, NotFoundPage, PricingPage, PrivacyPage, ReferralLandingPage, ReferralPolicyPage, RiskDisclosurePage, TermsPage } from './pages/public';
import { LoginPage, RegisterPage } from './pages/auth';
import { DashboardHome, InvestPage, ProfitHistoryPage, ReferralsPage, AiAgentPage, WithdrawPage, SettingsPage, SupportPage } from './pages/dashboard';
import { AdminPage } from './pages/admin/AdminPage';
import { Toaster } from 'react-hot-toast';
import { CustomCursor } from './components/ui/CustomCursor';
import { AuthProvider, useAuth } from './lib/auth';
import { useDashboardData } from './lib/dashboardData';

import { useSEO } from './hooks/useSEO';

function RouterSEO() {
  useSEO();
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RouterSEO />
        <CustomCursor />
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/referral" element={<ReferralLandingPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
            <Route path="/compliance" element={<CompliancePage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/referral-policy" element={<ReferralPolicyPage />} />
          </Route>

          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Dashboard Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="invest" element={<InvestPage />} />
              <Route path="profit" element={<ProfitHistoryPage />} />
              <Route path="referrals" element={<ReferralsPage />} />
              <Route path="ai-agent" element={<AiAgentPage />} />
              <Route path="withdraw" element={<WithdrawPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="support" element={<SupportPage />} />
            </Route>
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function RequireAdmin() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useDashboardData(user?.uid);

  if (loading || profileLoading) {
    return <div className="min-h-screen bg-dark-900 text-text-secondary flex items-center justify-center">Loading admin...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-dark-900 text-text-primary flex items-center justify-center px-4">
        <div className="gc max-w-lg w-full p-8 bg-dark-950">
          <h1 className="font-display text-2xl text-white mb-3">Access Denied</h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-6">
            You do not have the required permissions to access the administrator panel. Please return to the user dashboard.
          </p>
          <div className="flex gap-4">
            <Link to="/dashboard" className="btn-gold h-10 px-6 rounded-xl flex items-center justify-center text-sm font-medium">Return to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-dark-900 text-text-secondary flex items-center justify-center">Loading account...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
