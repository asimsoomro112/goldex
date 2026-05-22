import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { Footer } from '@/components/ui/Footer';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

/* ─── Font + CSS variable injection ─────────────────────────────────── */
const GLOBAL_STYLES = `
  :root {
    --gold-100: #FFF8E1;
    --gold-300: #FFD97D;
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-700: #9A7B1C;
    --surface-950: #05050E;
    --surface-900: #09090F;
    --surface-800: #0D0C1A;
    --text-bright: #F7F3E8;
    --text-mid:    #B8B0A0;
    --text-dim:    rgba(232,228,212,0.32);
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui:      'Outfit', sans-serif;
    --font-mono:    'JetBrains Mono', monospace;
    --ease-gold: cubic-bezier(0.4, 0, 0.2, 1);
    --nav-height: 72px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ::selection { background: rgba(212,175,55,0.22); color: #fff; }

  /* Scroll progress bar */
  #scroll-progress {
    position: fixed; top: 0; left: 0;
    height: 2px; z-index: 9999;
    background: linear-gradient(90deg, #9A7B1C, #F5C518, #D4AF37);
    box-shadow: 0 0 12px rgba(245,197,24,0.6);
    transform-origin: left;
    pointer-events: none;
    border-radius: 0 2px 2px 0;
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); filter: blur(4px); }
    to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
  }
  @keyframes navGlow {
    0%,100% { box-shadow: 0 12px 40px rgba(212,175,55,0.12); }
    50%      { box-shadow: 0 12px 40px rgba(212,175,55,0.22); }
  }
  @keyframes grain {
    0%,100% { transform: translate(0,0); }
    10%  { transform: translate(-2%, -3%); }
    30%  { transform: translate(3%, 2%); }
    50%  { transform: translate(-1%, 4%); }
    70%  { transform: translate(4%, -2%); }
    90%  { transform: translate(-3%, 1%); }
  }
  @keyframes shimmerSweep {
    0%   { left: -60%; }
    100% { left: 110%; }
  }
  @keyframes breathePip {
    0%,100% { opacity: 1; }
    50%      { opacity: 0.5; }
  }
  @keyframes menuOrb {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    50%      { transform: translate(-50%,-50%) scale(1.12); }
  }
`;

/* ─── Nav links ──────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'How It Works', path: '/how-it-works' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Referral', path: '/referral' },
  { name: 'Risk', path: '/risk-disclosure' },
  { name: 'About', path: '/about' },
];

type NavLinkItem = typeof NAV_LINKS[number];

/* ─── Single desktop nav link ────────────────────────────────────────── */
function NavLink({ link, isActive }: { link: NavLinkItem; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={link.path}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        fontFamily: 'var(--font-ui)',
        fontSize: 13.5,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#F5C518' : hovered ? 'rgba(247,243,232,0.85)' : 'rgba(184,176,160,0.8)',
        textDecoration: 'none',
        padding: '6px 0',
        letterSpacing: '0.01em',
        transition: 'color 0.2s var(--ease-gold)',
      }}
    >
      {link.name}

      {/* Active dot pip */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="nav-active-pip"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            style={{
              position: 'absolute',
              bottom: -2, left: '50%',
              transform: 'translateX(-50%)',
              width: 18, height: 2,
              borderRadius: 2,
              background: 'linear-gradient(90deg, #F5C518, #D4AF37)',
              boxShadow: '0 0 8px rgba(245,197,24,0.55)',
              animation: 'breathePip 2.5s ease-in-out infinite',
            }}
          />
        )}
      </AnimatePresence>

      {/* Hover underline sweep */}
      {!isActive && (
        <span style={{
          position: 'absolute',
          bottom: -2, left: 0,
          height: 1,
          width: hovered ? '100%' : '0%',
          background: 'linear-gradient(90deg, rgba(212,175,55,0.6), rgba(212,175,55,0.2))',
          borderRadius: 1,
          transition: 'width 0.28s var(--ease-gold)',
        }} />
      )}
    </Link>
  );
}

/* ─── Main export ────────────────────────────────────────────────────── */
export function MainLayout() {
  const location = useLocation();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [btnHover, setBtnHover] = useState<'signin' | 'start' | null>(null);

  /* Scroll state */
  useEffect(() => {
    const unsub = scrollY.on('change', v => setScrolled(v > 60));
    return unsub;
  }, [scrollY]);

  /* Scroll progress */
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close menu on route change */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* Lock body when menu open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      <AuroraBackground />

      {/* Scroll progress bar */}
      <div
        id="scroll-progress"
        style={{ width: `${progress}%` }}
      />

      {/* Noise grain overlay */}
      <div aria-hidden style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        opacity: 0.022,
        mixBlendMode: 'overlay',
        animation: 'grain 8s steps(10) infinite',
      }} />

      <div className="public-shell" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 10,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-bright)',
      }}>

        {/* ══════════════════════════════════════════════════
            NAVBAR
        ══════════════════════════════════════════════════ */}
        <header style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          zIndex: 50,
          padding: scrolled ? '12px 16px' : '0',
          transition: 'padding 0.45s var(--ease-gold)',
        }}>
          <div style={{
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.45s var(--ease-gold)',
            position: 'relative',

            /* Scrolled: floating pill */
            ...(scrolled ? {
              maxWidth: 960,
              height: 56,
              padding: '0 24px',
              borderRadius: 999,
              background: 'linear-gradient(135deg, rgba(9,9,15,0.75) 0%, rgba(5,5,14,0.82) 100%)',
              backdropFilter: 'blur(36px) saturate(180%)',
              WebkitBackdropFilter: 'blur(36px) saturate(180%)',
              border: '1px solid rgba(212,175,55,0.22)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(212,175,55,0.04)',
              animation: 'navGlow 4s ease-in-out infinite',
            } : {
              maxWidth: 1280,
              height: 72,
              padding: '0 28px',
              borderRadius: 0,
              background: 'transparent',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid transparent',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              boxShadow: 'none',
            }),
          }}>

            {/* Scrolled shimmer sweep */}
            {scrolled && (
              <div aria-hidden style={{
                position: 'absolute', inset: 0,
                borderRadius: 999, overflow: 'hidden',
                pointerEvents: 'none',
              }}>
                <div style={{
                  position: 'absolute', top: 0, width: '50%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                  animation: 'shimmerSweep 4s ease-in-out infinite',
                }} />
              </div>
            )}

            {/* ── Logo ── */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0, zIndex: 1 }}>
              <img
                src="/images/Navbar.png"
                alt="GoldEx"
                style={{
                  height: scrolled ? 34 : 40,
                  width: 'auto',
                  objectFit: 'contain',
                  transform: 'scale(2.1)',
                  transformOrigin: 'left center',
                  filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.3))',
                  transition: 'height 0.4s var(--ease-gold), filter 0.3s',
                }}
              />
            </Link>

            {/* ── Desktop nav links ── */}
            <nav style={{
              display: 'none',
              alignItems: 'center',
              gap: 36,
              position: 'relative',
              zIndex: 1,
            }}
              className="desktop-nav"
            >
              {NAV_LINKS.map(link => (
                <NavLink
                  key={link.path}
                  link={link}
                  isActive={location.pathname === link.path}
                />
              ))}
            </nav>

            {/* ── Desktop auth buttons ── */}
            <div style={{
              display: 'none',
              alignItems: 'center',
              gap: 10,
              zIndex: 1,
            }}
              className="desktop-auth"
            >
              <ThemeToggle />

              {/* Sign In */}
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button
                  onMouseEnter={() => setBtnHover('signin')}
                  onMouseLeave={() => setBtnHover(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '9px 20px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: btnHover === 'signin' ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.18)',
                    background: btnHover === 'signin' ? 'rgba(212,175,55,0.08)' : 'transparent',
                    color: btnHover === 'signin' ? '#F5C518' : 'rgba(184,176,160,0.8)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.22s var(--ease-gold)',
                    letterSpacing: '0.01em',
                  }}
                >
                  Sign In
                </button>
              </Link>

              {/* Start Trading (gold gradient CTA) */}
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button
                  onMouseEnter={() => setBtnHover('start')}
                  onMouseLeave={() => setBtnHover(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 20px',
                    borderRadius: 10,
                    border: '1px solid rgba(212,175,55,0.3)',
                    background: btnHover === 'start'
                      ? 'linear-gradient(135deg, #F5C518 0%, #D4AF37 60%, #B8962E 100%)'
                      : 'linear-gradient(135deg, #D4AF37 0%, #C19B2E 60%, #9A7B1C 100%)',
                    color: '#07070D',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    boxShadow: btnHover === 'start'
                      ? '0 6px 24px rgba(212,175,55,0.5), inset 0 1px 0 rgba(255,255,255,0.25)'
                      : '0 4px 16px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                    transform: btnHover === 'start' ? 'translateY(-1px)' : 'translateY(0)',
                    transition: 'all 0.22s var(--ease-gold)',
                  }}
                >
                  Start Trading
                  <ArrowRight style={{
                    width: 14, height: 14,
                    transform: btnHover === 'start' ? 'translateX(2px)' : 'translateX(0)',
                    transition: 'transform 0.22s',
                  }} />
                </button>
              </Link>
            </div>

            {/* ── Mobile menu trigger ── */}
            <div className="mobile-actions">
              <ThemeToggle compact className="mobile-theme-btn" />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen(true)}
                className="mobile-menu-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40,
                  borderRadius: 12,
                  border: '1px solid rgba(212,175,55,0.2)',
                  background: 'rgba(212,175,55,0.06)',
                  color: '#D4AF37',
                  cursor: 'pointer',
                  zIndex: 1,
                }}
              >
                <Menu style={{ width: 18, height: 18 }} />
              </motion.button>
            </div>
          </div>
        </header>

        {/* ══════════════════════════════════════════════════
            MOBILE FULL-SCREEN MENU OVERLAY
        ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{
                position: 'fixed', inset: 0,
                zIndex: 200,
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Backdrop */}
              <div
                onClick={() => setMenuOpen(false)}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(5,5,14,0.7)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              />

              {/* Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                style={{
                  position: 'absolute',
                  top: 12, right: 12, bottom: 12,
                  width: 'min(340px, calc(100vw - 24px))',
                  borderRadius: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  background: 'linear-gradient(160deg, rgba(13,12,26,0.96) 0%, rgba(5,5,14,0.98) 100%)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(212,175,55,0.18)',
                  boxShadow: '-16px 0 60px rgba(0,0,0,0.7), inset 1px 0 0 rgba(255,255,255,0.04)',
                }}
              >
                {/* Ambient gold orb top-right */}
                <div aria-hidden style={{
                  position: 'absolute', top: '15%', right: '-20%',
                  width: 200, height: 200,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)',
                  animation: 'menuOrb 4s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
                <div aria-hidden style={{
                  position: 'absolute', bottom: '20%', left: '-15%',
                  width: 160, height: 160,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />

                {/* ── Panel header ── */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 22px 16px',
                  borderBottom: '1px solid rgba(212,175,55,0.08)',
                  flexShrink: 0,
                }}>
                  {/* Wordmark */}
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
                      color: '#F5C518', letterSpacing: '0.02em',
                    }}>GoldEx</p>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9.5,
                      color: 'rgba(212,175,55,0.4)', letterSpacing: '0.08em',
                      textTransform: 'uppercase', marginTop: 1,
                    }}>Premium Trading</p>
                  </div>

                  {/* Close button */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      width: 36, height: 36,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(184,176,160,0.7)',
                      cursor: 'pointer',
                    }}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </motion.button>
                </div>

                {/* ── Nav links ── */}
                <nav style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  padding: '10px 10px',
                  gap: 2, overflowY: 'auto',
                }}>
                  {NAV_LINKS.map((link, i) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <motion.div
                        key={link.path}
                        initial={{ x: 24, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.055, type: 'spring', stiffness: 200, damping: 22 }}
                      >
                        <Link
                          to={link.path}
                          onClick={() => setMenuOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '13px 14px',
                            borderRadius: 14,
                            textDecoration: 'none',
                            background: isActive
                              ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)'
                              : 'transparent',
                            border: isActive
                              ? '1px solid rgba(212,175,55,0.2)'
                              : '1px solid transparent',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div>
                            <span style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: 22,
                              fontWeight: 600,
                              letterSpacing: '0.01em',
                              color: isActive ? '#F5C518' : 'rgba(247,243,232,0.85)',
                              display: 'block',
                              lineHeight: 1.1,
                            }}>
                              {link.name}
                            </span>
                            {isActive && (
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 9,
                                color: 'rgba(212,175,55,0.5)', letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                              }}>● Current page</span>
                            )}
                          </div>
                          <ArrowRight style={{
                            width: 14, height: 14,
                            color: isActive ? '#D4AF37' : 'rgba(212,175,55,0.2)',
                            flexShrink: 0,
                          }} />
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* ── Panel footer: auth buttons ── */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.35 }}
                  style={{
                    padding: '14px 14px 20px',
                    borderTop: '1px solid rgba(212,175,55,0.08)',
                    display: 'flex', flexDirection: 'column',
                    gap: 8, flexShrink: 0,
                  }}
                >
                  <Link to="/login" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                    <button style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '13px 0',
                      borderRadius: 14,
                      border: '1px solid rgba(212,175,55,0.2)',
                      background: 'transparent',
                      color: 'rgba(184,176,160,0.85)',
                      fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500,
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                    }}>
                      Sign In
                    </button>
                  </Link>

                  <Link to="/register" onClick={() => setMenuOpen(false)} style={{ textDecoration: 'none' }}>
                    <button style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8,
                      padding: '13px 0',
                      borderRadius: 14,
                      border: '1px solid rgba(212,175,55,0.25)',
                      background: 'linear-gradient(135deg, #D4AF37 0%, #C19B2E 60%, #9A7B1C 100%)',
                      color: '#07070D',
                      fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '0.02em',
                      boxShadow: '0 6px 24px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}>
                      <Sparkles style={{ width: 14, height: 14 }} />
                      Start Trading
                    </button>
                  </Link>

                  {/* Version tag */}
                  <p style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                    color: 'rgba(212,175,55,0.25)', letterSpacing: '0.07em',
                    marginTop: 4,
                  }}>
                    GoldEx v2.0 · Secured & Encrypted
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════
            PAGE CONTENT with animated transitions
        ══════════════════════════════════════════════════ */}
        <main style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          marginTop: 'var(--nav-height)',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <Footer />
      </div>

      {/* ── Responsive utilities ──────────────────────────────── */}
      <style>{`
        .desktop-nav,
        .desktop-auth,
        .mobile-theme-btn { display: none !important; }
        .mobile-actions { display: flex; align-items: center; gap: 8px; z-index: 1; }
        .mobile-menu-btn { display: flex !important; }

        @media (min-width: 1024px) {
          .desktop-nav,
          .desktop-auth   { display: flex !important; }
          .mobile-actions { display: none !important; }
          .mobile-theme-btn { display: none !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 1023px) {
          .mobile-theme-btn { display: inline-flex !important; }
        }
      `}</style>
    </>
  );
}
