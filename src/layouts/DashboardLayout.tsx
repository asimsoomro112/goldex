import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CircleDollarSign, LineChart, Users,
  Bot, CreditCard, Settings, LogOut, Bell, ChevronRight,
  Sparkles, TrendingUp, Shield, MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useDashboardData } from '@/lib/dashboardData';

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
        animation: 'breathe 2s ease-in-out infinite',
        display: 'inline-block',
      }} />
      Live
    </span>
  );
}

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
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 16px',
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
              position: 'absolute', left: 0,
              top: '18%', bottom: '18%',
              width: 3,
              borderRadius: '0 3px 3px 0',
              background: 'linear-gradient(180deg, #F5C518 0%, #D4AF37 100%)',
              boxShadow: '0 0 10px rgba(245,197,24,0.6), 0 0 20px rgba(212,175,55,0.3)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Ambient glow halo (active only) */}
      {isActive && (
        <span style={{
          position: 'absolute', inset: 0,
          borderRadius: 'var(--radius-sm)',
          background: `radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.10) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Icon with colored glow */}
      <span style={{
        width: 34, height: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 9,
        flexShrink: 0,
        background: isActive
          ? 'rgba(212,175,55,0.14)'
          : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'background 0.2s',
        boxShadow: isActive ? `inset 0 1px 0 rgba(255,255,255,0.1)` : 'none',
      }}>
        <item.icon style={{
          width: 16, height: 16,
          color: isActive ? '#F5C518' : hovered ? 'rgba(232,228,212,0.7)' : 'rgba(232,228,212,0.35)',
          transition: 'color 0.2s',
          filter: isActive ? 'drop-shadow(0 0 6px rgba(245,197,24,0.5))' : 'none',
        }} />
      </span>

      <span style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#F7F3E8' : hovered ? 'rgba(232,228,212,0.7)' : 'rgba(232,228,212,0.35)',
        transition: 'color 0.2s',
        letterSpacing: '0.01em',
      }}>
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

/* ─── Main layout ─── */
export function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { profile, totals } = useDashboardData(user?.uid);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const displayName = profile?.displayName || user?.displayName || 'Account';
  const initial = displayName.trim().charAt(0).toUpperCase() || '—';

  const currentNav = NAV_ITEMS.find(n =>
    location.pathname === n.path ||
    (n.path !== '/dashboard' && location.pathname.startsWith(n.path))
  );
  const pageTitle = currentNav?.label || 'Dashboard';

  return (
    <>
      {/* Font + animation injection */}
      <style>{FONT_LINK + shimmer}</style>

      <div style={{
        minHeight: '100vh',
        background: 'var(--surface-1)',
        display: 'flex',
        color: 'var(--text-bright)',
        fontFamily: 'var(--font-ui)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Global ambient background orbs ── */}
        <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <AmbientOrb cx="15%" cy="20%" r={300} color="rgba(212,175,55,0.15)" blur={120} />
          <AmbientOrb cx="80%" cy="70%" r={250} color="rgba(96,165,250,0.08)" blur={140} />
          <AmbientOrb cx="50%" cy="50%" r={200} color="rgba(192,132,252,0.06)" blur={160} />
          {/* Subtle grain overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.025,
            mixBlendMode: 'overlay',
          }} />
        </div>

        {/* ════════════════════════════════════════════
            DESKTOP SIDEBAR
        ════════════════════════════════════════════ */}
        <aside
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          style={{
            display: 'none',
            width: 268,
            flexDirection: 'column',
            position: 'sticky', top: 0,
            height: '100vh',
            zIndex: 20,
            flexShrink: 0,
            // Multi-layer glassmorphism
            background: 'linear-gradient(160deg, rgba(13,12,26,0.75) 0%, rgba(8,7,16,0.85) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderRight: '1px solid rgba(212,175,55,0.12)',
            boxShadow: '4px 0 40px rgba(0,0,0,0.5), inset -1px 0 0 rgba(212,175,55,0.06)',
          }}
          className="xl-flex"  // handle via CSS below
        >
          {/* Scanline sweep (subtle, decorative) */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, overflow: 'hidden',
            borderRadius: 0, pointerEvents: 'none', opacity: 0.03,
          }}>
            <div style={{
              position: 'absolute', left: 0, right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.8), transparent)',
              animation: 'scanline 8s linear infinite',
            }} />
          </div>

          {/* Sidebar ambient top glow */}
          <div aria-hidden style={{
            position: 'absolute', top: -60, left: '50%',
            width: 200, height: 160,
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.18) 0%, transparent 70%)',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }} />

          {/* ── Logo ── */}
          <div style={{
            height: 72, display: 'flex', alignItems: 'center',
            padding: '0 22px',
            borderBottom: '1px solid rgba(212,175,55,0.08)',
          }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <img
                src="/images/Navbar.png" alt="GoldEx"
                style={{
                  height: 38, width: 'auto', objectFit: 'contain',
                  transform: 'scale(2.1)', transformOrigin: 'left center',
                  filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.25))',
                  transition: 'filter 0.3s',
                }}
              />
            </Link>
          </div>

          {/* ── User card ── */}
          <Link
            to="/dashboard/settings"
            style={{
              display: 'block',
              textDecoration: 'none',
              margin: '16px 12px 8px',
              padding: '14px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.09) 0%, rgba(18,17,31,0.6) 100%)',
              border: '1px solid rgba(212,175,55,0.15)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}
          >
            {/* Card shimmer */}
            <div aria-hidden style={{
              position: 'absolute', top: 0, left: '-100%',
              width: '60%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
              animation: 'shimmer 3.5s ease-in-out infinite',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              {/* Avatar with gradient ring */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 46, height: 46,
                  borderRadius: '50%',
                  padding: 2,
                  background: 'conic-gradient(from 0deg, #F5C518, #D4AF37, #9A7B1C, #F5C518)',
                  boxShadow: '0 0 16px rgba(212,175,55,0.35)',
                  animation: 'goldPulse 3s ease-in-out infinite',
                }}>
                  <div style={{
                    width: '100%', height: '100%',
                    borderRadius: '50%',
                    background: 'var(--surface-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {profile?.photoURL
                      ? <img src={profile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: '#F5C518' }}>{initial}</span>
                    }
                  </div>
                </div>
                {/* Online dot */}
                <span style={{
                  position: 'absolute', bottom: 1, right: 1,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#4ADE80',
                  border: '2px solid var(--surface-3)',
                  boxShadow: '0 0 6px rgba(74,222,128,0.5)',
                }} />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'var(--font-ui)', fontSize: 13.5, fontWeight: 600,
                    color: 'var(--text-bright)', textOverflow: 'ellipsis',
                    overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 100,
                  }}>{displayName}</span>
                  <LiveBadge />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TrendingUp style={{ width: 10, height: 10, color: '#4ADE80' }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10.5,
                    color: '#4ADE80', letterSpacing: '0.02em',
                  }}>
                    +${totals.totalEarned.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* ── Section label ── */}
          <div style={{
            padding: '12px 20px 6px',
            fontFamily: 'var(--font-ui)', fontSize: 9.5,
            fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(212,175,55,0.35)',
          }}>
            Navigation
          </div>

          {/* ── Nav items ── */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8 }}>
            {NAV_ITEMS.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
              return <SideNavItem key={item.path} item={item} isActive={isActive} />;
            })}
          </nav>

          {/* ── Footer ── */}
          <div style={{
            borderTop: '1px solid rgba(212,175,55,0.08)',
            padding: '14px 12px',
          }}>
            {/* Version badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, padding: '0 4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield style={{ width: 11, height: 11, color: 'rgba(212,175,55,0.4)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'rgba(232,228,212,0.25)' }}>
                  GoldEx v2.0
                </span>
              </div>
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-ui)',
                color: 'rgba(74,222,128,0.5)', letterSpacing: '0.05em',
              }}>
                ● Secure
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 0',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,71,87,0.0)',
                border: '1px solid rgba(255,71,87,0.15)',
                color: 'rgba(232,228,212,0.4)',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,71,87,0.1)';
                e.currentTarget.style.color = '#FF4757';
                e.currentTarget.style.borderColor = 'rgba(255,71,87,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(232,228,212,0.4)';
                e.currentTarget.style.borderColor = 'rgba(255,71,87,0.15)';
              }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              Sign Out
            </motion.button>
          </div>
        </aside>

        {/* ════════════════════════════════════════════
            MAIN CONTENT AREA
        ════════════════════════════════════════════ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          minWidth: 0, position: 'relative', zIndex: 10,
          paddingBottom: 80, /* space for mobile nav */
        }}>

          {/* Background pattern */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
            backgroundImage: `url("/images/Dashboard Background Pattern.png")`,
            backgroundSize: 'cover',
            opacity: 0.14,
          }} />

          {/* ── Mobile / Tablet Top Header ── */}
          <header style={{
            height: 72,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            position: 'sticky', top: 0, zIndex: 30,
            // Glassmorphism header
            background: 'rgba(7,7,13,0.65)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            borderBottom: '1px solid rgba(212,175,55,0.09)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
            className="xl-hide"
          >
            {/* Page title */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6, overflow: 'visible', height: 20 }}>
                <img
                  src="/images/Navbar.png"
                  alt="GoldEx Logo"
                  style={{
                    height: 20,
                    width: 'auto',
                    objectFit: 'contain',
                    transform: 'scale(2.1)',
                    transformOrigin: 'left center',
                    filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.25))',
                    transition: 'filter 0.3s',
                  }}
                />
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22, fontWeight: 600,
                color: 'var(--text-bright)',
                letterSpacing: '0.01em',
                marginTop: 6,
              }}>{pageTitle}</h1>
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              {/* Notification bell */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setNotifOpen(v => !v)}
                style={{
                  position: 'relative',
                  width: 40, height: 40,
                  borderRadius: 12,
                  background: 'rgba(18,17,31,0.8)',
                  border: '1px solid rgba(212,175,55,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <Bell style={{ width: 16, height: 16, color: 'rgba(232,228,212,0.6)' }} />
                <span style={{
                  position: 'absolute', top: 7, right: 8,
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#F5C518',
                  boxShadow: '0 0 8px rgba(245,197,24,0.7)',
                  border: '1.5px solid var(--surface-1)',
                }} />
              </motion.button>

              {/* Notification Drawer Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: 'absolute',
                      top: 50, right: 0,
                      width: 290,
                      background: 'linear-gradient(135deg, rgba(13,12,26,0.96) 0%, rgba(8,8,15,0.98) 100%)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(212,175,55,0.25)',
                      borderRadius: 18,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.65)',
                      padding: '16px 14px',
                      zIndex: 100,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.06em' }}>
                        Notifications
                      </span>
                      <button 
                        onClick={() => setNotifOpen(false)}
                        style={{ background: 'none', border: 'none', color: 'rgba(212,175,55,0.6)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                      >
                        Close
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
                      <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#F7F3E8', marginBottom: 3 }}>Welcome to GoldEx!</p>
                        <p style={{ fontSize: 10.5, color: 'rgba(184,176,160,0.7)', lineHeight: 1.4 }}>Your secure trading dashboard records are now fully active.</p>
                      </div>
                      <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.12)' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#4ADE80', marginBottom: 3 }}>AI Agent Monitoring</p>
                        <p style={{ fontSize: 10.5, color: 'rgba(184,176,160,0.7)', lineHeight: 1.4 }}>Proprietary neural agent is active scanning live XAUUSD commodity price feeds.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Avatar Link to Settings */}
              <Link to="/dashboard/settings" style={{ display: 'block', textDecoration: 'none' }}>
                <motion.div
                  whileTap={{ scale: 0.93 }}
                  style={{
                    width: 40, height: 40,
                    borderRadius: 12,
                    padding: 1.5,
                    background: 'conic-gradient(from 45deg, #F5C518, #D4AF37, #9A7B1C, #F5C518)',
                    boxShadow: '0 0 14px rgba(212,175,55,0.3)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    width: '100%', height: '100%',
                    borderRadius: 10,
                    background: 'var(--surface-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden',
                  }}>
                    {profile?.photoURL
                      ? <img src={profile.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: '#F5C518' }}>{initial}</span>
                    }
                  </div>
                </motion.div>
              </Link>
            </div>
          </header>

          {/* ── Page content ── */}
          <main style={{
            flex: 1,
            padding: 'clamp(16px, 4vw, 40px)',
            position: 'relative', zIndex: 1,
            overflowX: 'hidden',
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* ════════════════════════════════════════════
            MOBILE BOTTOM DOCK — Floating Island 2026
            Two-layer approach: glass bar + content grid
            separated so center button can overflow freely
        ════════════════════════════════════════════ */}
        <div
          className="xl-hide"
          style={{
            position: 'fixed',
            bottom: 16, left: 16, right: 16,
            height: 70,
            zIndex: 1000,
          }}
        >
          {/* Layer 1 — Glass background bar (does NOT clip children) */}
          <div aria-hidden style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 70,
            borderRadius: 28,
            background: 'linear-gradient(160deg, rgba(13,12,26,0.88) 0%, rgba(8,7,16,0.94) 100%)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            border: '1px solid rgba(212,175,55,0.22)',
            boxShadow: `
              0 16px 48px rgba(0,0,0,0.7),
              0 0 0 1px rgba(255,255,255,0.04),
              inset 0 1px 0 rgba(255,255,255,0.08),
              0 0 24px rgba(212,175,55,0.09)
            `,
          }} />

          {/* Layer 2 — Content grid (overflow: visible so center pops out) */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 70,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            alignItems: 'center',     /* ← vertically centers all cells */
            overflow: 'visible',      /* ← center button can escape upward */
          }}>
            {MOBILE_ITEMS.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && !item.isCenter && location.pathname.startsWith(item.path));

              /* ── Center AI button ── */
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
                      /* Push the entire cell upward so button floats above bar */
                      transform: 'translateY(-24px)',
                      gap: 4,
                    }}
                  >
                    <motion.div
                      whileTap={{ scale: 0.88 }}
                      whileHover={{ scale: 1.06 }}
                      style={{
                        width: 62, height: 62,
                        borderRadius: 22,
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(8,7,16,0.96) 100%)' 
                          : 'linear-gradient(135deg, rgba(13,12,26,0.92) 0%, rgba(8,7,16,0.96) 100%)',
                        border: isActive ? '1.5px solid #FFD700' : '1.5px solid rgba(212,175,55,0.4)',
                        boxShadow: isActive
                          ? `
                            0 8px 28px rgba(212,175,55,0.55),
                            0 0 15px rgba(212,175,55,0.25),
                            inset 0 1px 0 rgba(255,255,255,0.1)
                          `
                          : `
                            0 6px 20px rgba(0,0,0,0.5),
                            inset 0 1px 0 rgba(255,255,255,0.05)
                          `,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        flexShrink: 0,
                      }}
                    >
                      {/* Pulsing outer ring */}
                      <motion.div
                        animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        style={{
                          position: 'absolute', inset: -5,
                          borderRadius: 27,
                          border: '2px solid rgba(245,197,24,0.5)',
                          pointerEvents: 'none',
                        }}
                      />
                      <img
                        src={item.img}
                        alt={item.label}
                        style={{
                          width: 42, height: 42,
                          objectFit: 'contain',
                          filter: isActive
                            ? 'drop-shadow(0 0 10px rgba(212,175,55,0.6))'
                            : 'drop-shadow(0 0 4px rgba(212,175,55,0.2))',
                          position: 'relative', zIndex: 1,
                        }}
                      />
                    </motion.div>

                    <span style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 8, fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#F5C518',
                      lineHeight: 1,
                    }}>
                      AI
                    </span>
                  </Link>
                );
              }

              /* ── Regular tab button ── */
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
                          width: 24, height: 2.5,
                          borderRadius: '0 0 4px 4px',
                          background: 'linear-gradient(90deg, #F5C518, #D4AF37)',
                          boxShadow: '0 2px 10px rgba(245,197,24,0.65)',
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Active radial glow */}
                  {isActive && (
                    <span aria-hidden style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(ellipse at 50% 60%, rgba(212,175,55,0.11) 0%, transparent 70%)',
                      borderRadius: 'inherit',
                      pointerEvents: 'none',
                    }} />
                  )}

                  {/* Icon wrapper */}
                  <motion.div
                    whileTap={{ scale: 0.80 }}
                    style={{
                      width: 42, height: 42,
                      borderRadius: 12,
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
                        width: 28, height: 28,
                        objectFit: 'contain',
                        transform: 'scale(1.15)',
                        filter: isActive
                          ? 'drop-shadow(0 0 7px rgba(212,175,55,0.55))'
                          : 'grayscale(100%) opacity(0.38)',
                        transition: 'filter 0.25s',
                      }}
                    />
                  </motion.div>

                  <span style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 8,
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.03em',
                    color: isActive ? '#F5C518' : 'rgba(232,228,212,0.3)',
                    transition: 'color 0.22s',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Responsive show/hide utility (avoids Tailwind xl: dependency) ── */}
      <style>{`
        .xl-flex  { display: none !important; }
        .xl-hide  { display: flex  !important; }
        @media (min-width: 1280px) {
          .xl-flex { display: flex !important; }
          .xl-hide { display: none !important; }
          nav[style*="position: fixed"] { display: none !important; }
          div[style*="paddingBottom: 80"] { padding-bottom: 0 !important; }
        }
      `}</style>
    </>
  );
}
