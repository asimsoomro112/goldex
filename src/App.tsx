import React from 'react';
import { BrowserRouter, Navigate, Outlet, Routes, Route, Link, useLocation } from 'react-router-dom';

// Public Layout Components
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Dashboard Layout
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage, CompliancePage, FeesPage, HowItWorksPage, NotFoundPage, PricingPage, PrivacyPage, ReferralLandingPage, ReferralPolicyPage, RiskDisclosurePage, TermsPage } from './pages/public';
import { LoginPage, RegisterPage } from './pages/auth';
const DashboardHome = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.DashboardHome })));
const InvestPage = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.InvestPage })));
const ProfitHistoryPage = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.ProfitHistoryPage })));
const ReferralsPage = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.ReferralsPage })));
const AiAgentPage = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.AiAgentPage })));
const WithdrawPage = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.WithdrawPage })));
const SettingsPage = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.SettingsPage })));
const SupportPage = React.lazy(() => import('./pages/dashboard').then(m => ({ default: m.SupportPage })));
const AdminPage = React.lazy(() => import('./pages/admin/AdminPage').then(m => ({ default: m.AdminPage })));
const OnboardingPage = React.lazy(() => import('./pages/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth';
import { DashboardDataProvider, useDashboardData } from './lib/dashboardData';
import { ThemeProvider } from './lib/theme';

import { useSEO } from './hooks/useSEO';

function RouterSEO() {
  useSEO();
  return null;
}

function RootSpinner() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent" />
      <span className="text-sm font-medium tracking-wide">Loading platform...</span>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RouterSEO />
          <Toaster position="top-right" />
          <React.Suspense fallback={<RootSpinner />}>
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
            <Route element={<OnboardingGuard />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
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
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function RequireAdmin() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useDashboardData(user?.uid);

  if (loading || profileLoading) {
    return <div className="min-h-screen bg-white dark:bg-dark-900 text-text-secondary flex items-center justify-center">Loading admin...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white dark:bg-dark-900 text-text-primary flex items-center justify-center px-4">
        <div className="gc max-w-lg w-full p-8 bg-white dark:bg-dark-950">
          <h1 className="font-display text-2xl text-neutral-900 dark:text-white mb-3">Access Denied</h1>
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
    return <div className="min-h-screen bg-white dark:bg-dark-900 text-text-secondary flex items-center justify-center">Loading account...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardDataProvider uid={user.uid}>
      <Outlet />
    </DashboardDataProvider>
  );
}

function OnboardingGuard() {
  const { user } = useAuth();
  const { profile, loading } = useDashboardData(user?.uid);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D4AF37] border-t-transparent" />
        <span className="text-sm font-medium tracking-wide">Loading account details...</span>
      </div>
    );
  }

  const isOnboardingPath = location.pathname === '/onboarding';

  if (profile && !profile.onboardingComplete) {
    if (!isOnboardingPath) {
      return <Navigate to="/onboarding" replace />;
    }
  } else if (profile && profile.onboardingComplete) {
    if (isOnboardingPath) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
