import React, { useState, Suspense } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CircleDollarSign, LineChart, Users,
  Bot, CreditCard, Settings, LogOut, Bell, ChevronRight,
  Sparkles, TrendingUp, Shield, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useDashboardData } from '@/lib/dashboardData';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

/* ─── Premium font injection (Cormorant Garamond + Outfit + JetBrains Mono) ─── */
const FONT_LINK = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root {
    --gold-100: #FFF8E1;
    --gold-300: #FFD97D;
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-700: #9A7B1C;
    --glass-bg: rgba(8, 7, 18, 0.55);
    --glass-border: rgba(212,175,55,0.18);
    --glass-hover: rgba(212,175,55,0.08);
    --surface-1: #07070D;
    --surface-2: #0D0C1A;
    --surface-3: #12111F;
    --text-bright: #F7F3E8;
    --text-mid: #B8B0A0;
    --text-dim: rgba(232,228,212,0.35);
    --glow-gold: rgba(212,175,55,0.22);
    --glow-gold-strong: rgba(245,197,24,0.35);
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui: 'Outfit', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --radius-sm: 10px;
    --radius-md: 16px;
    --radius-lg: 24px;
    --radius-xl: 32px;
  }
`;

/* ─── Nav config ─── */
const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', accent: '#D4AF37' },
  { icon: CircleDollarSign, label: 'Invest', path: '/dashboard/invest', accent: '#4ADE80' },
  { icon: LineChart, label: 'Profits', path: '/dashboard/profit', accent: '#60A5FA' },
  { icon: Users, label: 'Referrals', path: '/dashboard/referrals', accent: '#C084FC' },
  { icon: Bot, label: 'AI Agent', path: '/dashboard/ai-agent', accent: '#F472B6' },
  { icon: CreditCard, label: 'Withdraw', path: '/dashboard/withdraw', accent: '#FB923C' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings', accent: '#94A3B8' },
  { icon: MessageSquare, label: 'Support', path: '/dashboard/support', accent: '#FFD700' },
];

const MOBILE_ITEMS = [
  { img: '/images/Mobile App.png', label: 'Home', path: '/dashboard' },
  { img: '/images/Gold Bar Trading.png', label: 'Invest', path: '/dashboard/invest' },
  { img: '/images/Ai icon.png', label: 'AI', path: '/dashboard/ai-agent', isCenter: true },
  { img: '/images/Referrals.png', label: 'Refer', path: '/dashboard/referrals' },
  { img: '/images/shield Security.png', label: 'Profile', path: '/dashboard/settings' },
];

type NavItem = typeof NAV_ITEMS[number];

type AmbientOrbProps = {
  cx: number | string;
  cy: number | string;
  r: number;
  color: string;
  opacity?: number;
  blur?: number;
};

/* ─── Ambient orb (decorative background blob) ─── */
function AmbientOrb({ cx, cy, r, color, opacity = 0.12, blur = 80 }: AmbientOrbProps) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', left: cx, top: cy,
        width: r * 2, height: r * 2,
        borderRadius: '50%',
        background: color,
        opacity,
        filter: `blur(${blur}px)`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ─── Shimmer bar for loading skeletons ─── */
const shimmer = `
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @keyframes goldPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
    50%       { box-shadow: 0 0 20px 4px rgba(212,175,55,0.3); }
  }
  @keyframes breathe {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.6; transform: scale(0.85); }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes orbFloat {
    0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
    50%       { transform: translate(-50%, -50%) translateY(-20px); }
  }
`;

/* ─── Live badge ─── */
function LiveBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 999,
      background: 'rgba(74,222,128,0.12)',
      border: '1px solid rgba(74,222,128,0.3)',
      fontSize: 9, fontFamily: 'var(--font-ui)',
      fontWeight: 600, letterSpacing: '0.08em',
      color: '#4ADE80', textTransform: 'uppercase',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: '#4ADE80',
        display: 'inline-block',
      }} />
      Live
    </span>
  );
}

import { Avatar } from '@/components/ui/Avatar';

/* ─── Sidebar nav item ─── */
function SideNavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={item.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        margin: '1px 8px',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isActive
          ? '1px solid rgba(212,175,55,0.28)'
          : '1px solid transparent',
        background: isActive
          ? 'linear-gradient(135deg, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.05) 100%)'
          : hovered
            ? 'rgba(212,175,55,0.06)'
            : 'transparent',
        boxShadow: isActive
          ? `inset 0 1px 1px rgba(255,255,255,0.08), 0 4px 16px rgba(212,175,55,0.1), 0 0 0 1px rgba(212,175,55,0.05)`
          : 'none',
      }}
    >
      {/* Active indicator bar */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="sidebar-pip"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            style={{
              position: 'absolute',
              left: 0,
              top: '18%',
              bottom: '18%',
              width: 3,
              borderRadius: '0 3px 3px 0',
              background: 'linear-gradient(180deg, #F5C518 0%, #D4AF37 100%)',
              boxShadow: '0 0 10px rgba(245,197,24,0.6), 0 0 20px rgba(212,175,55,0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Ambient glow halo */}
      {isActive && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--radius-sm)',
            background: `radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.10) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Icon */}
      <span
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          flexShrink: 0,
          background: isActive
            ? 'rgba(212,175,55,0.14)'
            : hovered
              ? 'rgba(255,255,255,0.04)'
              : 'transparent',
          transition: 'background 0.2s',
          boxShadow: isActive ? `inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
        }}
      >
        <item.icon
          style={{
            width: 15,
            height: 15,
            color: isActive
              ? '#D4AF37'
              : hovered
                ? 'var(--text-mid)'
                : 'var(--text-dim)',
            transition: 'color 0.2s',
            filter: isActive ? 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' : 'none',
          }}
        />
      </span>

      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          color: isActive
            ? 'var(--text-bright)'
            : hovered
              ? 'var(--text-mid)'
              : 'var(--text-dim)',
          transition: 'color 0.2s',
          letterSpacing: '0.01em',
        }}
      >
        {item.label}
      </span>

      {/* Right chevron hint on hover */}
      <AnimatePresence>
        {hovered && !isActive && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            style={{ marginLeft: 'auto' }}
          >
            <ChevronRight style={{ width: 12, height: 12, color: 'rgba(212,175,55,0.4)' }} />
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6 py-2 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 w-1/3">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-xl w-3/4" />
        <div className="h-3 bg-neutral-100 dark:bg-neutral-850 rounded-lg w-1/2" />
      </div>
      
      {/* Mini Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-24 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-2xl shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
            <div className="h-5 bg-neutral-350 dark:bg-neutral-750 rounded w-3/4" />
          </div>
        </div>
        <div className="h-24 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-2xl shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
            <div className="h-5 bg-neutral-350 dark:bg-neutral-750 rounded w-2/3" />
          </div>
        </div>
        <div className="h-24 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-2xl shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
            <div className="h-5 bg-neutral-350 dark:bg-neutral-750 rounded w-1/2" />
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="h-80 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 rounded-3xl w-full" />
    </div>
  );
}

/* ─── Main layout ─── */
export function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { profile, totals } = useDashboardData(user?.uid);
  const [notifOpen, setNotifOpen] = useState(false);

  const displayName = profile?.displayName || user?.displayName || 'Account';

  const currentNav = NAV_ITEMS.find((n) =>
    location.pathname === n.path ||
    (n.path !== '/dashboard' && location.pathname.startsWith(n.path))
  );
  const pageTitle = currentNav?.label || 'Dashboard';

  return (
    <>
      {/* Font + animation injection */}
      <style>{FONT_LINK + shimmer}</style>

      <div
        className="dashboard-shell"
        style={{
          minHeight: '100vh',
          background: 'var(--surface-1)',
          display: 'flex',
          color: 'var(--text-bright)',
          fontFamily: 'var(--font-ui)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Global ambient background orbs */}
        <div aria-hidden className="dashboard-static-bg" />

        {/* DESKTOP SIDEBAR */}
        <aside
          style={{
            display: 'none',
            width: 240,
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            zIndex: 20,
            flexShrink: 0,
            background: 'var(--grad-dark)',
            borderRight: '1px solid var(--glass-border)',
            boxShadow: '4px 0 40px rgba(0,0,0,0.1), inset -1px 0 0 rgba(212,175,55,0.06)',
          }}
          className="xl-flex dashboard-sidebar"
        >
          {/* Logo */}
          <div
            style={{
              height: 72,
              display: 'flex',
              alignItems: 'center',
              padding: '0 20px',
              borderBottom: '1px solid rgba(212,175,55,0.08)',
            }}
          >
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                overflow: 'visible',
              }}
            >
              <img
                src="/images/Navbar.png"
                alt="GoldEx"
                style={{
                  height: 32,
                  width: 'auto',
                  objectFit: 'contain',
                  transform: 'scale(1.8)',
                  transformOrigin: 'left center',
                  filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.25))',
                }}
              />
            </Link>
          </div>

          {/* User Profile Card */}
          <Link
            to="/dashboard/settings"
            style={{
              display: 'block',
              textDecoration: 'none',
              margin: '16px 12px 8px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.09) 0%, var(--surface-3) 100%)',
              border: '1px solid rgba(212,175,55,0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <Avatar src={profile?.photoURL} name={displayName} size="sm" />

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-bright)',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      maxWidth: 80,
                    }}
                  >
                    {displayName}
                  </span>
                  <LiveBadge />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TrendingUp style={{ width: 10, height: 10, color: 'var(--profit)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--profit)',
                      letterSpacing: '0.02em',
                      fontWeight: 600,
                    }}
                  >
                    +${totals.totalEarned.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Section Label */}
          <div
            style={{
              padding: '12px 20px 6px',
              fontFamily: 'var(--font-ui)',
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(212,175,55,0.35)',
            }}
          >
            Navigation
          </div>

          {/* Nav Items */}
          <nav
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              paddingBottom: 8,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return <SideNavItem key={item.path} item={item} isActive={isActive} />;
            })}
          </nav>

          {/* Footer controls */}
          <div
            style={{
              borderTop: '1px solid rgba(212,175,55,0.08)',
              padding: '12px',
            }}
          >
            <ThemeToggle className="w-full mb-3" />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                padding: '0 4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield style={{ width: 11, height: 11, color: 'rgba(212,175,55,0.4)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--text-dim)',
                  }}
                >
                  GoldEx v2.0
                </span>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'var(--font-ui)',
                  color: 'rgba(74,222,128,0.6)',
                  letterSpacing: '0.05em',
                }}
              >
                ● Secure
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 0',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                border: '1px solid rgba(255,71,87,0.15)',
                color: 'var(--text-mid)',
                fontFamily: 'var(--font-ui)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,71,87,0.1)';
                e.currentTarget.style.color = '#FF4757';
                e.currentTarget.style.borderColor = 'rgba(255,71,87,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-mid)';
                e.currentTarget.style.borderColor = 'rgba(255,71,87,0.15)';
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              Sign Out
            </motion.button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div
          className="dashboard-content-shell"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            position: 'relative',
            zIndex: 10,
            paddingBottom: 80,
          }}
        >
          {/* Background pattern */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 0,
              backgroundImage: `url("/images/Dashboard Background Pattern.png")`,
              backgroundSize: 'cover',
              opacity: 0.08,
            }}
          />

          {/* Mobile / Tablet Top Header */}
          <header
            style={{
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              position: 'sticky',
              top: 0,
              zIndex: 30,
              background: 'var(--glass-2)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              borderBottom: '1px solid var(--glass-border)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}
            className="xl-hide"
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 6,
                  overflow: 'visible',
                  height: 20,
                }}
              >
                <img
                  src="/images/Navbar.png"
                  alt="GoldEx Logo"
                  style={{
                    height: 18,
                    width: 'auto',
                    objectFit: 'contain',
                    transform: 'scale(1.8)',
                    transformOrigin: 'left center',
                    filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.25))',
                  }}
                />
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--text-bright)',
                  letterSpacing: '0.01em',
                  marginTop: 4,
                }}
              >
                {pageTitle}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <ThemeToggle compact />

              {/* Notification bell */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setNotifOpen((v) => !v)}
                style={{
                  position: 'relative',
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--surface-3)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <Bell style={{ width: 16, height: 16, color: 'var(--text-mid)' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: 7,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--brand-gold)',
                    boxShadow: '0 0 8px rgba(212,175,55,0.7)',
                    border: '1.5px solid var(--surface-1)',
                  }}
                />
              </motion.button>

              {/* Dropdown notifications */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: 48,
                      right: 0,
                      width: 280,
                      background: 'var(--glass-3)',
                      backdropFilter: 'var(--glass-blur)',
                      WebkitBackdropFilter: 'var(--glass-blur)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 16,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      padding: '16px 14px',
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                        padding: '0 4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--brand-gold)',
                          letterSpacing: '0.06em',
                        }}
                      >
                        Notifications
                      </span>
                      <button
                        onClick={() => setNotifOpen(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--brand-gold)',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Close
                      </button>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        maxHeight: 220,
                        overflowY: 'auto',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'var(--surface-3)',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: 'var(--text-bright)',
                            marginBottom: 3,
                          }}
                        >
                          Welcome to GoldEx!
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.4 }}>
                          Your secure trading dashboard records are now fully active.
                        </p>
                      </div>
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          background: 'var(--surface-3)',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: 'var(--profit)',
                            marginBottom: 3,
                          }}
                        >
                          AI Agent Monitoring
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-mid)', lineHeight: 1.4 }}>
                          Proprietary neural agent is active scanning live XAUUSD commodity price feeds.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile Avatar */}
              <Link to="/dashboard/settings" style={{ display: 'block', textDecoration: 'none' }}>
                <Avatar src={profile?.photoURL} name={displayName} size="sm" />
              </Link>
            </div>
          </header>

          {/* Page Content wrapper */}
          <main
            style={{
              flex: 1,
              padding: 'clamp(16px, 4vw, 40px)',
              position: 'relative',
              zIndex: 1,
              overflowX: 'hidden',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                <Suspense fallback={<DashboardLoading />}>
                  <Outlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* MOBILE BOTTOM DOCK */}
        <div
          className="xl-hide"
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            right: 16,
            height: 70,
            zIndex: 1000,
          }}
        >
          {/* Glass background bar */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 70,
              borderRadius: 28,
              background: 'var(--glass-2)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              boxShadow: `
                0 16px 48px rgba(0,0,0,0.1),
                0 0 0 1px rgba(255,255,255,0.04),
                inset 0 1px 0 rgba(255,255,255,0.08),
                0 0 24px rgba(212,175,55,0.05)
              `,
            }}
          />

          {/* regular navigation item buttons grid */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 70,
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              alignItems: 'center',
              overflow: 'visible',
            }}
          >
            {MOBILE_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && !item.isCenter && location.pathname.startsWith(item.path));

              /* Center AI Button */
              if (item.isCenter) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      transform: 'translateY(-24px)',
                      gap: 4,
                    }}
                  >
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      whileHover={{ scale: 1.06 }}
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 20,
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, var(--surface-2) 100%)'
                          : 'linear-gradient(135deg, var(--surface-3) 0%, var(--surface-2) 100%)',
                        border: isActive ? '1.5px solid var(--brand-gold)' : '1.5px solid rgba(212,175,55,0.4)',
                        boxShadow: isActive
                          ? `
                            0 8px 28px rgba(212,175,55,0.35),
                            0 0 15px rgba(212,175,55,0.15),
                            inset 0 1px 0 rgba(255,255,255,0.1)
                          `
                          : `
                            0 6px 20px rgba(0,0,0,0.1),
                            inset 0 1px 0 rgba(255,255,255,0.05)
                          `,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: -4,
                          borderRadius: 24,
                          border: '1px solid rgba(245,197,24,0.2)',
                          pointerEvents: 'none',
                        }}
                      />
                      <img
                        src={item.img}
                        alt={item.label}
                        style={{
                          width: 38,
                          height: 38,
                          objectFit: 'contain',
                          filter: isActive
                            ? 'drop-shadow(0 0 10px rgba(212,175,55,0.5))'
                            : 'drop-shadow(0 0 4px rgba(212,175,55,0.15))',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                    </motion.div>

                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--brand-gold)',
                        lineHeight: 1,
                      }}
                    >
                      AI
                    </span>
                  </Link>
                );
              }

              /* Regular Navigation Link button */
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    height: '100%',
                    padding: '0 4px',
                    position: 'relative',
                    textDecoration: 'none',
                  }}
                >
                  {/* Top pip indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-dock-pip"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0, scaleX: 0 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          width: 24,
                          height: 2.5,
                          borderRadius: '0 0 4px 4px',
                          background: 'linear-gradient(90deg, #F5C518, #D4AF37)',
                          boxShadow: '0 2px 10px rgba(245,197,24,0.4)',
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {isActive && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.08) 0%, transparent 70%)',
                        borderRadius: 'inherit',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Icon wrapper */}
                  <motion.div
                    whileTap={{ scale: 0.8 }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? 'rgba(212,175,55,0.13)' : 'transparent',
                      transition: 'background 0.22s',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.img}
                      alt={item.label}
                      style={{
                        width: 26,
                        height: 26,
                        objectFit: 'contain',
                        transform: 'scale(1.15)',
                        filter: isActive
                          ? 'drop-shadow(0 0 7px rgba(212,175,55,0.55))'
                          : 'grayscale(100%) opacity(0.38)',
                        transition: 'filter 0.25s',
                      }}
                    />
                  </motion.div>

                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 8,
                      fontWeight: isActive ? 600 : 400,
                      letterSpacing: '0.03em',
                      color: isActive ? 'var(--brand-gold)' : 'var(--text-muted)',
                      transition: 'color 0.22s',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Responsive show/hide style utility for 240px sidebar width */}
      <style>{`
        .dashboard-static-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.045), transparent 38%, rgba(96,165,250,0.035));
        }
        .xl-flex  { display: none !important; }
        .xl-hide  { display: flex  !important; }
        @media (prefers-reduced-motion: reduce) {
          .dashboard-shell *, .dashboard-shell *::before, .dashboard-shell *::after {
            animation: none !important;
            transition-duration: 0.01ms !important;
          }
        }
        @media (min-width: 1280px) {
          .dashboard-shell {
            height: 100vh !important;
            min-height: 100vh !important;
            overflow: hidden !important;
          }
          .xl-flex { display: flex !important; }
          .xl-hide { display: none !important; }
          .dashboard-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            height: 100vh !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .dashboard-content-shell {
            margin-left: 240px !important;
            width: calc(100% - 240px) !important;
            flex: 0 0 calc(100% - 240px) !important;
            height: 100vh !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            padding-bottom: 0 !important;
          }
          nav[style*="position: fixed"] { display: none !important; }
          div[style*="paddingBottom: 80"] { padding-bottom: 0 !important; }
        }
      `}</style>
    </>
  );
}
