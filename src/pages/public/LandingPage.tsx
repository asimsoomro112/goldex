import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Lock, TrendingUp, Bot, Sparkles, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-600: #B8962E;
    --gold-700: #9A7B1C;
    --surface-950: #05050E;
    --surface-900: #08080F;
    --surface-800: #0D0C1A;
    --surface-700: #111020;
    --green-400: #4ADE80;
    --blue-400: #60A5FA;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui: 'Outfit', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);

    --tier-starter: #60A5FA;
    --tier-growth: #F5C518;
    --tier-elite: #4ADE80;
  }

  :root[data-theme="light"] {
    --tier-starter: #1D4ED8;
    --tier-growth: #8B6914;
    --tier-elite: #047857;
  }

  @keyframes floatA {
    0%,100% { transform: translateY(0px)   rotate(-1deg); }
    50%      { transform: translateY(-18px) rotate(1deg);  }
  }
  @keyframes floatB {
    0%,100% { transform: translateY(0px)  translateX(0px); }
    33%      { transform: translateY(-8px) translateX(4px); }
    66%      { transform: translateY(6px)  translateX(-4px); }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes orbitGlow {
    0%,100% { box-shadow: 0 0 40px 10px rgba(212,175,55,0.25); }
    50%      { box-shadow: 0 0 70px 20px rgba(212,175,55,0.40); }
  }
  @keyframes coinPulse {
    0%,100% { filter: drop-shadow(0 0 24px rgba(212,175,55,0.5)); }
    50%      { filter: drop-shadow(0 0 48px rgba(212,175,55,0.75)); }
  }
  @keyframes cardFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes scanUp {
    0%   { top: 100%; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: -10%; opacity: 0; }
  }
  @keyframes breatheGold {
    0%,100% { opacity: 0.5; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.05); }
  }
  @keyframes tickerMove {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lp-hero-title {
    font-family: var(--font-display);
    font-size: clamp(56px, 8vw, 112px);
    font-weight: 700;
    line-height: 0.92;
    letter-spacing: -0.02em;
  }
  .lp-gold-text {
    background: linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 65%, #9A7B1C 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lp-card {
    background: var(--glass-2);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    box-shadow: var(--shadow-card);
  }
  .feature-card {
    background: var(--glass-2);
    border: 1px solid var(--glass-border);
    border-radius: 22px;
    overflow: hidden;
    position: relative;
    transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
    cursor: default;
  }
  .feature-card:hover {
    border-color: var(--gb-hover);
    box-shadow: var(--shadow-float), var(--glow-sm);
    transform: translateY(-4px);
  }
  .stat-card {
    background: var(--glass-2);
    border: 1px solid var(--glass-border);
    border-radius: 18px;
    padding: 28px 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .stat-card:hover {
    border-color: var(--gb-hover);
    box-shadow: var(--shadow-float), var(--glow-sm);
  }

  /* ── SCROLL CONTAINER — tall spacer ── */
  #scroll-container {
    position: relative;
    height: 350vh;
  }

  /* ── STICKY HERO ── */
  #hero {
    position: sticky;
    top: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: var(--surface-950);
  }

  /* ── CANVAS — replaces video ── */
  #scrub-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  /* ── LOADING SCREEN ── */
  #loading-screen {
    position: absolute;
    inset: 0;
    background: var(--surface-950);
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    transition: opacity 0.8s ease, visibility 0.8s;
  }
  #loading-screen.hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  .loading-logo {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.4em;
    color: var(--gold-500);
    text-transform: uppercase;
  }
  .loading-bar-wrap {
    width: 220px;
    height: 2px;
    background: rgba(212,175,55,0.15);
    overflow: hidden;
    border-radius: 999px;
  }
  .loading-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-500), var(--gold-400));
    width: 0%;
    transition: width 0.2s ease;
  }
  .loading-pct {
    font-size: 11px;
    letter-spacing: 0.3em;
    color: rgba(212,175,55,0.5);
    font-family: var(--font-mono);
  }
`;

/* ─────────────────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────────────────── */
function AnimatedStat({
  value,
  label,
  prefix = '',
  suffix = '',
  delay = 0,
}: {
  value: string | number;
  label: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      className="stat-card"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0, 0, 0.2, 1] }}
    >
      {/* Corner accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 60, height: 60,
        background: 'radial-gradient(circle at top right, rgba(212,175,55,0.12), transparent)',
        borderRadius: '0 18px 0 0',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(36px, 5vw, 52px)',
        fontWeight: 700,
        lineHeight: 1,
        marginBottom: 10,
        background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 50%, #D4AF37 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        animation: inView ? `countUp 0.5s ease ${delay}s forwards` : 'none',
      }}>
        {prefix}{value}{suffix}
      </div>

      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 12,
        fontWeight: 500, letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
      }}>
        {label}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   FLOATING HERO WIDGET CARD
───────────────────────────────────────────────────────────────────── */
function HeroWidget({
  style,
  children,
  floatDelay = '0s',
}: {
  style?: React.CSSProperties;
  children: React.ReactNode;
  floatDelay?: string;
}) {
  return (
    <div style={{
      ...style,
      animation: `cardFloat 5s ease-in-out ${floatDelay} infinite`,
    }}>
      <div className="lp-card" style={{ padding: '14px 18px', minWidth: 160 }}>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   FEATURE CARD
───────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '/images/Ai icon.png',
    label: 'AI Agent',
    badge: 'NEW',
    accentColor: '#F472B6',
    desc: 'Live account-aware AI context. Responds to your portfolio, not generic training data.',
  },
  {
    icon: '/images/Gold Bar Trading.png',
    label: 'XAUUSD Focus',
    badge: null,
    accentColor: '#F5C518',
    desc: 'Gold market tools without fabricated pricing or simulated trading results.',
  },
  {
    icon: '/images/shield Security.png',
    label: 'Locked Principal',
    badge: null,
    accentColor: '#60A5FA',
    desc: 'Your investment amount stays locked while daily profit accumulates in isolation.',
  },
  {
    icon: '/images/Daily Profits.png',
    label: 'USDT BEP20 Only',
    badge: null,
    accentColor: '#4ADE80',
    desc: 'Deposits restricted to BEP20 USDT in $50 multiples — transparent by design.',
  },
];

type Feature = typeof FEATURES[number];

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0, 0, 0.2, 1] }}
      className="feature-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Colored top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${feature.accentColor}, transparent)`,
        opacity: hovered ? 1 : 0.4,
        transition: 'opacity 0.3s',
      }} />

      {/* Corner glow on hover */}
      <div style={{
        position: 'absolute', top: -40, left: -40,
        width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${feature.accentColor}22, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.35s',
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '28px 26px', position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        {feature.badge && (
          <div style={{ marginBottom: 14 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 999,
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.28)',
              fontFamily: 'var(--font-ui)', fontSize: 9.5,
              fontWeight: 700, letterSpacing: '0.1em',
              color: '#F5C518', textTransform: 'uppercase',
            }}>
              <Sparkles style={{ width: 9, height: 9 }} /> {feature.badge}
            </span>
          </div>
        )}

        {/* Icon */}
        <div style={{
          width: 52, height: 52,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${feature.accentColor}22 0%, ${feature.accentColor}08 100%)`,
          border: `1px solid ${feature.accentColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          transition: 'transform 0.3s',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}>
          <img src={feature.icon} alt={feature.label}
            style={{
              width: 28, height: 28, objectFit: 'contain',
              filter: `drop-shadow(0 0 6px ${feature.accentColor}66)`
            }}
          />
        </div>

        <h4 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22, fontWeight: 700,
          color: 'var(--text-bright)', marginBottom: 10,
          letterSpacing: '0.01em',
        }}>
          {feature.label}
        </h4>

        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: 13.5, lineHeight: 1.7,
          color: 'var(--text-secondary)',
          fontWeight: 300,
        }}>
          {feature.desc}
        </p>

        {/* Learn more hover reveal */}
        <div style={{
          marginTop: 20,
          display: 'flex', alignItems: 'center', gap: 4,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'all 0.28s',
        }}>
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.04em', color: feature.accentColor,
          }}>Learn more</span>
          <ChevronRight style={{ width: 12, height: 12, color: feature.accentColor }} />
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   1. PROFIT CALCULATOR SECTION
───────────────────────────────────────────────────────────────────── */

function ProfitCalculator() {
  const [investment, setInvestment] = useState(100);
  const [rate, setRate] = useState(0.75); // percentage value (e.g., 0.75 = 0.75%)
  const [days, setDays] = useState(30);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  // Dynamic tier-based rate range
  const tierMinRate = investment >= 5000 ? 1.2 : investment >= 500 ? 1.0 : 0.5;
  const tierMaxRate = investment >= 5000 ? 1.5 : investment >= 500 ? 1.2 : 1.0;
  const tierName = investment >= 5000 ? 'Elite' : investment >= 500 ? 'Growth' : 'Starter';

  // Clamp rate to current tier range when investment changes
  const clampedRate = Math.min(Math.max(rate, tierMinRate), tierMaxRate);
  if (clampedRate !== rate && investment > 0) {
    // Will be set on next render via the slider
  }

  const effectiveRate = Math.min(Math.max(rate, tierMinRate), tierMaxRate);
  const dailyProfit = investment * (effectiveRate / 100);
  const totalProfit = dailyProfit * days;
  const totalValue = investment + totalProfit;

  const presets = [50, 100, 500, 1000, 5000];

  return (
    <section ref={ref} style={{
      maxWidth: 1280, margin: '0 auto',
      padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 48px)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
        style={{ textAlign: 'center', marginBottom: 56 }}
      >
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(212,175,55,0.5)', marginBottom: 12,
        }}>Profit Estimator</p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 58px)',
          fontWeight: 700, lineHeight: 1.05,
          color: 'var(--text-bright)', letterSpacing: '-0.01em',
        }}>
          Estimate Your <span style={{
            background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 65%, #9A7B1C 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Potential Returns.</span>
        </h2>
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: 'clamp(14px, 2vw, 17px)',
          fontWeight: 300, color: 'var(--text-secondary)',
          maxWidth: 460, margin: '16px auto 0', lineHeight: 1.6,
        }}>
          Adjust your investment and see real-time projections based on your tier’s daily rate.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'stretch',
        }}
      >
        {/* Controls panel */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(13,12,26,0.85) 0%, rgba(8,8,15,0.90) 100%)',
          border: '1px solid rgba(212,175,55,0.14)',
          borderRadius: 24, backdropFilter: 'blur(20px)',
          padding: '36px 32px',
        }}>
          {/* Investment amount */}
          <div style={{ marginBottom: 32 }}>
            <label style={{
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(212,175,55,0.6)', display: 'block', marginBottom: 14,
            }}>Investment Amount</label>

            {/* Preset buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {presets.map(p => (
                <button key={p} onClick={() => setInvestment(p)} style={{
                  height: 36, padding: '0 14px', borderRadius: 10,
                  border: `1px solid ${investment === p ? 'rgba(212,175,55,0.5)' : 'rgba(212,175,55,0.14)'}`,
                  background: investment === p ? 'rgba(212,175,55,0.12)' : 'transparent',
                  color: investment === p ? '#F5C518' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  ${p}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)', fontSize: 18, color: '#D4AF37',
              }}>$</span>
              <input
                type="number"
                min={50} step={50}
                value={investment}
                onChange={e => setInvestment(Math.max(50, Number(e.target.value)))}
                style={{
                  width: '100%', height: 54, paddingLeft: 36, paddingRight: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(212,175,55,0.2)',
                  background: 'rgba(5,5,14,0.6)',
                  color: 'var(--text-bright)', fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Daily rate slider */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <label style={{
                fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.6)',
              }}>Daily Profit Rate <span style={{ color: tierName === 'Elite' ? '#4ADE80' : tierName === 'Growth' ? '#F5C518' : '#60A5FA', fontWeight: 800 }}>({tierName})</span></label>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
                color: '#4ADE80',
              }}>{effectiveRate.toFixed(2)}%</span>
            </div>
            <input
              type="range" min={tierMinRate} max={tierMaxRate} step={0.05}
              value={effectiveRate}
              onChange={e => setRate(Number(e.target.value))}
              style={{
                width: '100%', height: 4, appearance: 'none',
                background: `linear-gradient(90deg, #4ADE80 ${((effectiveRate - tierMinRate) / (tierMaxRate - tierMinRate)) * 100}%, rgba(74,222,128,0.15) ${((effectiveRate - tierMinRate) / (tierMaxRate - tierMinRate)) * 100}%)`,
                borderRadius: 999, cursor: 'pointer', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{tierMinRate}% min</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{tierMaxRate}% max</span>
            </div>
          </div>

          {/* Days selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <label style={{
                fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.6)',
              }}>Duration</label>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: '#60A5FA',
              }}>{days} days</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[7, 14, 30, 60, 90].map(d => (
                <button key={d} onClick={() => setDays(d)} style={{
                  flex: 1, minWidth: 48, height: 36, borderRadius: 10,
                  border: `1px solid ${days === d ? 'rgba(96,165,250,0.4)' : 'rgba(96,165,250,0.12)'}`,
                  background: days === d ? 'rgba(96,165,250,0.1)' : 'transparent',
                  color: days === d ? '#60A5FA' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(13,12,26,0.85) 0%, rgba(8,8,15,0.90) 100%)',
          border: '1px solid rgba(212,175,55,0.14)',
          borderRadius: 24, backdropFilter: 'blur(20px)',
          padding: '36px 32px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* Main result */}
          <div>
            <p style={{
              fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(212,175,55,0.5)', marginBottom: 8,
            }}>Projected Profit After {days} Days</p>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(48px, 8vw, 72px)',
              fontWeight: 700, lineHeight: 1,
              background: 'linear-gradient(135deg, #4ADE80 0%, #22D3A0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              marginBottom: 8,
            }}>
              +${totalProfit.toFixed(2)}
            </div>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--text-muted)', marginBottom: 32,
            }}>
              Total value: <span style={{ color: 'var(--text-bright)' }}>${totalValue.toFixed(2)}</span>
            </p>
          </div>

          {/* Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Daily Profit', val: `$${dailyProfit.toFixed(2)}`, color: '#4ADE80' },
              { label: 'Weekly Profit', val: `$${(dailyProfit * 7).toFixed(2)}`, color: '#60A5FA' },
              { label: 'Your Principal', val: `$${investment}`, color: '#F5C518', locked: true },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.locked && <Lock style={{ width: 11, height: 11, color: row.color, opacity: 0.6 }} />}
                  <span style={{
                    fontFamily: 'var(--font-ui)', fontSize: 13,
                    color: 'var(--text-secondary)',
                  }}>{row.label}</span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14,
                  fontWeight: 600, color: row.color,
                }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* Withdrawal note */}
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: 'rgba(212,175,55,0.05)',
            border: '1px solid rgba(212,175,55,0.12)',
          }}>
            <p style={{
              fontFamily: 'var(--font-ui)', fontSize: 11.5,
              color: 'rgba(212,175,55,0.6)', lineHeight: 1.5, margin: 0,
            }}>
              ⚠️ These are estimated projections only. Actual returns depend on market conditions and are not guaranteed.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}


/* ─────────────────────────────────────────────────────────────────────
   2. HOW IT WORKS — 4-Step Process
───────────────────────────────────────────────────────────────────── */

const HOW_STEPS = [
  {
    num: '01',
    icon: '🔐',
    title: 'Create Account',
    desc: 'Sign up with your email in under 2 minutes. Quick, simple, and secure.',
    color: '#F5C518',
  },
  {
    num: '02',
    icon: '💎',
    title: 'Deposit USDT BEP20',
    desc: 'Send $50 or more (in $50 multiples) as USDT on the BEP20 network. Your deposit is verified on BscScan.',
    color: '#60A5FA',
  },
  {
    num: '03',
    icon: '⚡',
    title: 'Start Earning Daily',
    desc: 'Your investment starts earning daily profit based on your tier. Track your earnings in your dashboard in real time.',
    color: '#4ADE80',
  },
  {
    num: '04',
    icon: '💸',
    title: 'Withdraw Profit',
    desc: 'Once your profit reaches $50, request a withdrawal. Paid directly to your USDT BEP20 wallet address.',
    color: '#F472B6',
  },
];

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <section ref={ref} style={{
      position: 'relative',
      padding: 'clamp(60px, 8vw, 100px) 0',
      overflow: 'hidden',
    }}>
      {/* Subtle grid background */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(rgba(212,175,55,0.06) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* BG glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 600, height: 300,
        background: 'radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 clamp(16px, 5vw, 48px)',
        position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(212,175,55,0.5)', marginBottom: 12,
          }}>Simple Process</p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 700, lineHeight: 1.05,
            color: 'var(--text-bright)', letterSpacing: '-0.01em',
          }}>
            4 Steps to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Daily Returns.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          position: 'relative',
        }}>
          {/* Connecting line (desktop) */}
          <div aria-hidden style={{
            position: 'absolute', top: 52, left: '12.5%', right: '12.5%',
            height: 1,
            background: 'linear-gradient(90deg, rgba(212,175,55,0.06), rgba(212,175,55,0.18), rgba(212,175,55,0.06))',
            zIndex: 0,
          }} />

          {HOW_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              style={{
                background: 'linear-gradient(145deg, rgba(13,12,26,0.80) 0%, rgba(7,7,13,0.90) 100%)',
                border: '1px solid rgba(212,175,55,0.10)',
                borderRadius: 22, padding: '32px 26px',
                position: 'relative', zIndex: 1,
                textAlign: 'center',
                transition: 'border-color 0.3s, transform 0.3s',
              }}
              whileHover={{ y: -4, borderColor: 'rgba(212,175,55,0.28)' }}
            >
              {/* Step number */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 52, height: 52, borderRadius: '50%',
                background: `${step.color}12`,
                border: `1px solid ${step.color}30`,
                margin: '0 auto 20px',
                position: 'relative',
              }}>
                <span style={{ fontSize: 22 }}>{step.icon}</span>
                {/* Step num badge */}
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20, borderRadius: '50%',
                  background: `${step.color}`,
                  color: '#07070D',
                  fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{step.num}</span>
              </div>

              <h4 style={{
                fontFamily: 'var(--font-display)', fontSize: 22,
                fontWeight: 700, color: 'var(--text-bright)',
                marginBottom: 10, letterSpacing: '0.01em',
              }}>{step.title}</h4>

              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: 13.5,
                lineHeight: 1.7, color: 'var(--text-secondary)',
                fontWeight: 300,
              }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────────────────────────────
   3. INVESTMENT TIERS
───────────────────────────────────────────────────────────────────── */

const TIERS = [
  {
    label: 'Starter',
    amount: 50,
    dailyMin: 0.25,
    dailyMax: 0.50,
    color: 'var(--tier-starter)',
    perks: ['$0.25–$0.50 daily profit', '0.5% – 1.0% daily rate', 'Withdraw at $50 profit', 'AI monitoring active'],
    popular: false,
  },
  {
    label: 'Growth',
    amount: 500,
    dailyMin: 5.00,
    dailyMax: 6.00,
    color: 'var(--tier-growth)',
    perks: ['$5.00–$6.00 daily profit', '1.0% – 1.2% daily rate', 'Priority AI data feed', 'Full dashboard access'],
    popular: true,
  },
  {
    label: 'Elite',
    amount: 5000,
    dailyMin: 60.00,
    dailyMax: 75.00,
    color: 'var(--tier-elite)',
    perks: ['$60–$75 daily profit', '1.2% – 1.5% daily rate', 'Highest yield tier', 'Advanced profit tracking'],
    popular: false,
  },
];

function InvestmentTiers() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <section ref={ref} style={{
      maxWidth: 1280, margin: '0 auto',
      padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 48px)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
        style={{ textAlign: 'center', marginBottom: 60 }}
      >
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--gold-500)', marginBottom: 12,
        }}>Pricing Plans</p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 58px)',
          fontWeight: 700, lineHeight: 1.05,
          color: 'var(--text-bright)', letterSpacing: '-0.01em',
        }}>
          Start at Any{' '}
          <span style={{
            background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>$50 Multiple.</span>
        </h2>
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: 'clamp(14px, 2vw, 17px)',
          fontWeight: 300, color: 'var(--text-secondary)',
          maxWidth: 460, margin: '16px auto 0', lineHeight: 1.6,
        }}>
          Higher tiers earn higher daily rates. Scale up when you're ready.
        </p>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 20, alignItems: 'start',
      }}>
        {TIERS.map((tier, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: i * 0.1 }}
            style={{
              background: 'var(--glass-2)',
              border: `1px solid ${tier.popular ? 'var(--gold-500)' : 'var(--glass-border)'}`,
              borderRadius: 24,
              overflow: 'hidden',
              position: 'relative',
              transform: tier.popular ? 'scale(1.03)' : 'scale(1)',
              boxShadow: tier.popular ? 'var(--shadow-float), var(--glow-sm)' : 'var(--shadow-card)',
            }}
          >
            {/* Popular badge */}
            {tier.popular && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #FFD97D, #D4AF37, #9A7B1C)',
              }} />
            )}
            {tier.popular && (
              <div style={{
                position: 'absolute', top: 20, right: 20,
                padding: '4px 12px', borderRadius: 999,
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.3)',
                fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--gold-500)',
              }}>Most Popular</div>
            )}

            <div style={{ padding: '36px 30px' }}>
              {/* Label */}
              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: tier.color, marginBottom: 8,
              }}>{tier.label}</p>

              {/* Amount */}
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 52,
                fontWeight: 700, lineHeight: 1,
                color: 'var(--text-bright)', marginBottom: 4,
              }}>
                ${tier.amount}
              </div>
              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: 12,
                color: 'var(--text-muted)', marginBottom: 24,
              }}>minimum deposit</p>

              {/* Daily range */}
              <div style={{
                padding: '14px 18px', borderRadius: 14,
                background: `color-mix(in srgb, ${tier.color} 4%, transparent)`,
                border: `1px solid color-mix(in srgb, ${tier.color} 13%, transparent)`,
                marginBottom: 28,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-ui)', fontSize: 12,
                  color: 'var(--text-muted)',
                }}>Daily profit</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 16,
                  fontWeight: 700, color: tier.color,
                }}>
                  ${tier.dailyMin.toFixed(2)}–${tier.dailyMax.toFixed(2)}
                </span>
              </div>

              {/* Perks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {tier.perks.map((perk, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: `color-mix(in srgb, ${tier.color} 10%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${tier.color} 21%, transparent)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 9, color: tier.color }}>✓</span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-ui)', fontSize: 13,
                      color: 'var(--text-secondary)', fontWeight: 300,
                    }}>{perk}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button style={{
                  width: '100%', height: 48, borderRadius: 12,
                  border: `1px solid ${tier.popular ? 'rgba(212,175,55,0.3)' : `color-mix(in srgb, ${tier.color} 15%, transparent)`}`,
                  background: tier.popular
                    ? 'linear-gradient(135deg, #D4AF37 0%, #C19B2E 55%, #9A7B1C 100%)'
                    : `color-mix(in srgb, ${tier.color} 7%, transparent)`,
                  color: tier.popular ? '#07070D' : tier.color,
                  fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.02em',
                  transition: 'all 0.22s',
                }}>
                  Start with ${tier.amount}
                </button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────────────────────────────
   4. TRUST & SECURITY SECTION
───────────────────────────────────────────────────────────────────── */

const TRUST_ITEMS = [
  {
    icon: '🔒',
    title: 'Principal Always Locked',
    desc: 'Your deposited amount is never touched. Only the daily profit is accessible for withdrawal — principal stays secured.',
    color: '#4ADE80',
  },
  {
    icon: '🛡️',
    title: 'USDT BEP20 Exclusivity',
    desc: 'We only accept USDT on the BEP20 network. This eliminates transfer errors and ensures transaction traceability.',
    color: '#60A5FA',
  },
  {
    icon: '🤖',
    title: 'No Fabricated Data',
    desc: 'All price feeds and profit calculations are driven by live XAUUSD market data. No simulated or backtested results displayed.',
    color: '#F5C518',
  },
  {
    icon: '📊',
    title: 'Transparent Profit Rules',
    desc: 'Every rule is stated upfront: 0.5%–1.5% daily based on tier, withdraw at $50 profit, principal stops earning post-settlement.',
    color: '#F472B6',
  },
  {
    icon: '⚡',
    title: 'Instant Deposit Reflection',
    desc: 'BEP20 confirmations are fast. Your investment starts earning from the next cycle after confirmation.',
    color: '#A78BFA',
  },
  {
    icon: '🏦',
    title: 'No Hidden Fees',
    desc: 'What you deposit is what earns. No platform fees, no management charges, no withdrawal penalties.',
    color: '#FB923C',
  },
];

function TrustSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <section ref={ref} style={{
      position: 'relative',
      padding: 'clamp(60px, 8vw, 100px) 0',
      overflow: 'hidden',
    }}>
      {/* Subtle grid pattern */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: `radial-gradient(rgba(212,175,55,0.06) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '0 clamp(16px, 5vw, 48px)',
        position: 'relative', zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <p style={{
            fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(212,175,55,0.5)', marginBottom: 12,
          }}>Why Trust Us</p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 58px)',
            fontWeight: 700, lineHeight: 1.05,
            color: 'var(--text-bright)', letterSpacing: '-0.01em',
          }}>
            Built on{' '}
            <span style={{
              background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Transparency.</span>
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{
                background: 'linear-gradient(145deg, rgba(13,12,26,0.75) 0%, rgba(7,7,13,0.85) 100%)',
                border: '1px solid rgba(212,175,55,0.08)',
                borderRadius: 18, padding: '26px 24px',
                display: 'flex', gap: 18, alignItems: 'flex-start',
                transition: 'border-color 0.3s, transform 0.3s',
                cursor: 'default',
              }}
              whileHover={{ borderColor: `${item.color}30`, y: -2 }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${item.color}12`,
                border: `1px solid ${item.color}28`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>{item.icon}</div>
              <div>
                <h4 style={{
                  fontFamily: 'var(--font-display)', fontSize: 18,
                  fontWeight: 700, color: 'var(--text-bright)', marginBottom: 6,
                }}>{item.title}</h4>
                <p style={{
                  fontFamily: 'var(--font-ui)', fontSize: 13,
                  lineHeight: 1.65, color: 'var(--text-secondary)',
                  fontWeight: 300, margin: 0,
                }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────────────────────────────
   5. LIVE STATS TICKER (Simulated Market Activity)
───────────────────────────────────────────────────────────────────── */

function PlatformHighlights() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const highlights = [
    { icon: '👥', value: '850+', label: 'Active Investors', color: '#4ADE80' },
    { icon: '💰', value: '$120K+', label: 'Total Profits Paid', color: '#F5C518' },
    { icon: '⚡', value: '24/7', label: 'AI Monitoring Active', color: '#60A5FA' },
    { icon: '🔒', value: '100%', label: 'Deposits Verified On-Chain', color: '#A78BFA' },
  ];

  return (
    <section ref={ref} style={{
      maxWidth: 1280, margin: '0 auto',
      padding: '0 clamp(16px, 5vw, 48px) clamp(60px, 8vw, 100px)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
        style={{
          background: 'linear-gradient(135deg, rgba(13,12,26,0.85) 0%, rgba(8,8,15,0.90) 100%)',
          border: '1px solid rgba(212,175,55,0.14)',
          borderRadius: 24, overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(212,175,55,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#4ADE80',
              boxShadow: '0 0 10px #4ADE80',
              animation: 'breatheGold 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}>Platform Overview</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'rgba(212,175,55,0.4)', letterSpacing: '0.05em',
          }}>Since Launch 2026</span>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 0,
        }}>
          {highlights.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              style={{
                padding: '28px 28px',
                borderRight: i < highlights.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', gap: 10,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${item.color}12`,
                border: `1px solid ${item.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 36px)',
                  fontWeight: 700, color: item.color, lineHeight: 1,
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 500,
                  color: 'var(--text-muted)', marginTop: 6,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  {item.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}


/* ─────────────────────────────────────────────────────────────────────
   6. FAQ SECTION
───────────────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: 'What is the minimum investment?',
    a: 'The minimum deposit is $50 USDT BEP20. You can deposit any multiple of $50 — $50, $100, $150, $200, etc.',
  },
  {
    q: 'When can I withdraw my profit?',
    a: 'Profit withdrawal unlocks once your accumulated profit reaches $50. After you request a withdrawal, that investment stops generating profit and your principal is returned.',
  },
  {
    q: 'Is my principal at risk?',
    a: 'Your principal stays locked and separate from your daily profit accumulation. It is not used in any trading activity — only profit is generated on top of it.',
  },
  {
    q: 'Why only USDT BEP20?',
    a: 'BEP20 ensures fast, low-cost transactions on the Binance Smart Chain. Restricting to one network eliminates cross-chain errors and makes every transaction traceable.',
  },
  {
    q: 'How is daily profit calculated?',
    a: 'Your daily profit is 0.5%–1% of your total investment amount. For example, $200 earns $1.00–$2.00 per day. The exact rate is determined by live XAUUSD market conditions.',
  },
  {
    q: 'Can I make multiple deposits?',
    a: 'Yes. Each deposit of $50 or any $50 multiple creates an independent investment that earns its own daily profit.',
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <section ref={ref} style={{
      maxWidth: 860, margin: '0 auto',
      padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 48px)',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55 }}
        style={{ textAlign: 'center', marginBottom: 56 }}
      >
        <p style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(212,175,55,0.5)', marginBottom: 12,
        }}>Got Questions?</p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 5vw, 58px)',
          fontWeight: 700, lineHeight: 1.05,
          color: 'var(--text-bright)', letterSpacing: '-0.01em',
        }}>
          Frequently Asked{' '}
          <span style={{
            background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Questions.</span>
        </h2>
      </motion.div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {FAQS.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            style={{
              background: 'linear-gradient(145deg, rgba(13,12,26,0.80) 0%, rgba(7,7,13,0.90) 100%)',
              border: `1px solid ${openIndex === i ? 'rgba(212,175,55,0.28)' : 'rgba(212,175,55,0.09)'}`,
              borderRadius: 16, overflow: 'hidden',
              transition: 'border-color 0.25s',
            }}
          >
            {/* Question row */}
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              style={{
                width: '100%', padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
                color: openIndex === i ? '#F5C518' : '#F7F3E8',
                transition: 'color 0.25s', lineHeight: 1.3,
              }}>{faq.q}</span>
              <span style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: openIndex === i ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${openIndex === i ? 'rgba(212,175,55,0.28)' : 'rgba(255,255,255,0.06)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: openIndex === i ? '#F5C518' : 'var(--text-muted)',
                fontSize: 16, fontWeight: 300, transition: 'all 0.25s',
                transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
              }}>+</span>
            </button>

            {/* Answer */}
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
                >
                  <div style={{
                    padding: '0 24px 20px',
                    borderTop: '1px solid rgba(212,175,55,0.06)',
                    paddingTop: 16,
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-ui)', fontSize: 14,
                      lineHeight: 1.7, color: 'var(--text-secondary)',
                      fontWeight: 300, margin: 0,
                    }}>{faq.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}


/* ─────────────────────────────────────────────────────────────────────
   TICKER MARQUEE
───────────────────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  '● Deposits verified on BscScan',
  '◆ USDT BEP20 network only',
  '● Withdraw profit anytime after $50',
  '◆ Your deposit stays secure',
  '● 24/7 live gold price monitoring',
  '◆ Transparent fee structure',
  '● Real-time dashboard tracking',
  '◆ Encrypted & protected',
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // double for seamless loop
  return (
    <div style={{
      width: '100%', overflow: 'hidden',
      borderTop: '1px solid rgba(212,175,55,0.10)',
      borderBottom: '1px solid rgba(212,175,55,0.10)',
      background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.04), transparent)',
      height: 42,
      display: 'flex', alignItems: 'center',
      position: 'relative', zIndex: 10,
    }}>
      {/* Edge fade left */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
        background: 'linear-gradient(90deg, var(--surface-950, #05050E), transparent)',
        pointerEvents: 'none',
      }} />
      {/* Edge fade right */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 2,
        background: 'linear-gradient(270deg, var(--surface-950, #05050E), transparent)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex', gap: 52, whiteSpace: 'nowrap',
        animation: 'tickerMove 50s linear infinite',
        willChange: 'transform',
      }}>
        {items.map((item, i) => (
          <span key={i} style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            fontWeight: 500, letterSpacing: '0.06em',
            color: item.startsWith('●')
              ? 'rgba(212,175,55,0.65)'
              : 'var(--text-muted)',
          }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────── */
export function LandingPage() {
  const [ctaHover, setCtaHover] = useState<string | null>(null);

  // Scroll Frame scrubbing refs & states
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);

  const totalFramesToLoad = 288; // Pixel-perfect 60fps scrubbing with 288 frames

  // Helper to construct frame URL
  const getFrameUrl = (idx: number) => {
    const num = String(idx + 1).padStart(4, '0');
    return `/frames/frame${num}.jpg`;
  };

  // Draw frame to canvas
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imagesRef.current[index];
    if (!img || !img.complete) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const scale = Math.max(cw / iw, ch / ih);
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh);
  };

  // Resize canvas handler
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(currentFrameRef.current);
  };

  // Preload logic
  useEffect(() => {
    // 1. Check if first frame exists
    const testImg = new Image();
    testImg.src = getFrameUrl(0);
    testImg.onload = () => {
      // First frame exists, load the downsampled set
      preloadAll();
    };
    testImg.onerror = () => {
      // No frames folder found, use fallback instantly
      setUseFallback(true);
      setLoading(false);
    };

    const preloadAll = () => {
      let loaded = 0;
      const tempImages: HTMLImageElement[] = [];

      for (let i = 0; i < totalFramesToLoad; i++) {
        const frameIdx = i; // Load all 240 frames sequentially
        const img = new Image();
        img.src = getFrameUrl(frameIdx);
        img.onload = () => {
          loaded++;
          setLoadedCount(loaded);
          if (loaded === 1) {
            imagesRef.current = tempImages;
            resizeCanvas();
          }
          if (loaded === totalFramesToLoad) {
            setLoading(false);
          }
        };
        img.onerror = () => {
          loaded++;
          setLoadedCount(loaded);
          if (loaded === totalFramesToLoad) {
            setLoading(false);
          }
        };
        tempImages.push(img);
      }
      imagesRef.current = tempImages;
    };
  }, []);

  // Listen to resize and scroll
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    
    const handleScroll = () => {
      if (useFallback) return;

      const container = containerRef.current;
      if (!container) return;

      const scrollY = window.scrollY;
      const containerH = container.offsetHeight;
      const windowH = window.innerHeight;
      const maxScroll = containerH - windowH;
      if (maxScroll <= 0) return;

      const progress = Math.min(Math.max(scrollY / maxScroll, 0), 1);
      const imagesCount = imagesRef.current.length;
      if (imagesCount === 0) return;

      const frameIndex = Math.min(
        Math.floor(progress * (imagesCount - 1)),
        imagesCount - 1
      );

      if (frameIndex !== currentFrameRef.current) {
        currentFrameRef.current = frameIndex;
        drawFrame(frameIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [useFallback]);

  return (
    <>
      <style>{STYLES}</style>

      <div style={{
        width: '100%', flex: 1,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-bright)',
        background: 'transparent',
      }}>

        {/* ══════════════════════════════════════════════════
            HERO SECTION (Scroll Frame scrub animation)
        ══════════════════════════════════════════════════ */}
        <div ref={containerRef} id="scroll-container" style={{ position: 'relative', height: useFallback ? 'auto' : '350vh' }}>
          <section id="hero" style={{
            position: useFallback ? 'relative' : 'sticky',
            top: 0,
            width: '100%',
            minHeight: useFallback ? '92vh' : '100vh',
            display: 'flex', alignItems: 'center',
            paddingTop: useFallback ? 100 : 0,
            paddingBottom: useFallback ? 80 : 0,
            overflow: 'hidden',
            background: 'var(--surface-950)',
          }}>
            
            {/* Loading screen */}
            {loading && !useFallback && (
              <div id="loading-screen">
                <div className="loading-logo">GoldEx</div>
                <div className="loading-bar-wrap">
                  <div className="loading-bar-fill" style={{ width: `${Math.round((loadedCount / totalFramesToLoad) * 100)}%` }} />
                </div>
                <p className="loading-pct">{Math.round((loadedCount / totalFramesToLoad) * 100)}%</p>
              </div>
            )}

            {/* Canvas or Fallback Image Background */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            }}>
              {useFallback ? (
                <img src="/images/Hero Background.png" alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                />
              ) : (
                <canvas ref={canvasRef} id="scrub-canvas" />
              )}
              {/* Gradient overlay for text readability */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(105deg, rgba(5,5,14,0.75) 0%, rgba(5,5,14,0.3) 55%, rgba(5,5,14,0.6) 100%)',
              }} />
            </div>

            {/* Ambient orbs */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
              <div style={{
                position: 'absolute', top: '10%', left: '-5%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
                filter: 'blur(60px)',
              }} />
              <div style={{
                position: 'absolute', bottom: '5%', right: '-10%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)',
                filter: 'blur(80px)',
              }} />
            </div>

            {/* Content grid */}
            <div style={{
              maxWidth: 1280, margin: '0 auto',
              padding: '0 clamp(16px, 5vw, 48px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 40,
              alignItems: 'center',
              position: 'relative', zIndex: 2,
              width: '100%',
            }}>

              {/* ── LEFT: Text content ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>

                {/* Pill label */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '7px 16px 7px 10px',
                    borderRadius: 999,
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.22)',
                    marginBottom: 32,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(212,175,55,0.15)',
                    animation: 'breatheGold 2.5s ease-in-out infinite',
                  }}>
                    <Zap style={{ width: 10, height: 10, color: '#F5C518' }} />
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-ui)', fontSize: 11.5,
                    fontWeight: 600, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#D4AF37',
                  }}>
                    Gold-Linked Daily Returns
                  </span>
                </motion.div>

                {/* Main headline — oversized serif */}
                <motion.div
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.2 }}
                  style={{ marginBottom: 24 }}
                >
                  <h1 className="lp-hero-title" style={{ color: 'var(--text-bright)', display: 'block', marginBottom: 4 }}>
                    Invest in Gold.<br />
                    <span className="lp-gold-text">Earn Daily.</span>
                  </h1>
                </motion.div>

                {/* Protective Glass Container specifically for descriptions */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  style={{
                    padding: '24px 28px',
                    borderRadius: 18,
                    background: 'rgba(5, 5, 14, 0.55)',
                    border: '1px solid rgba(212, 175, 55, 0.14)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
                    maxWidth: 480,
                    marginBottom: 32,
                  }}
                >
                  {/* Sub-description */}
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)', fontSize: 'clamp(14px, 1.8vw, 16px)',
                      fontWeight: 300, lineHeight: 1.6,
                      color: 'var(--text-secondary)',
                      marginBottom: 12,
                    }}
                  >
                    Deposit as little as $50 in USDT (BEP20).
                    Your investment earns daily profit while your deposit stays secure.{' '}
                    <span style={{ color: '#4ADE80', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.95em' }}>Simple and transparent.</span>
                  </p>

                  {/* Fine print — trust signal */}
                  <p
                    style={{
                      fontFamily: 'var(--font-ui)', fontSize: 12,
                      fontWeight: 400, lineHeight: 1.55,
                      color: 'var(--text-muted)',
                    }}
                  >
                    Withdraw your profit once it reaches $50. Your deposit stays locked
                    during the earning period. All transactions are verified on-chain.
                  </p>
                </motion.div>

                {/* Stat pills */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}
                >
                  {[
                    { val: '$50', lbl: 'Min. Deposit', color: '#F5C518' },
                    { val: '0.5–1%', lbl: 'Daily Profit', color: '#4ADE80' },
                    { val: 'USDT', lbl: 'BEP20 Only', color: '#60A5FA' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '8px 16px',
                      borderRadius: 999,
                      background: `${s.color}0D`,
                      border: `1px solid ${s.color}28`,
                      backdropFilter: 'blur(8px)',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 14,
                        fontWeight: 600, color: s.color, lineHeight: 1,
                      }}>{s.val}</span>
                      <span style={{
                        fontFamily: 'var(--font-ui)', fontSize: 11,
                        fontWeight: 400, color: 'rgba(232,228,212,0.4)',
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                      }}>{s.lbl}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.72 }}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}
                >
                  {/* Primary gold CTA */}
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <button
                      onMouseEnter={() => setCtaHover('primary')}
                      onMouseLeave={() => setCtaHover(null)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        height: 54, padding: '0 28px',
                        borderRadius: 14,
                        border: '1px solid rgba(212,175,55,0.3)',
                        background: ctaHover === 'primary'
                          ? 'linear-gradient(135deg, #F5C518 0%, #D4AF37 55%, #B8962E 100%)'
                          : 'linear-gradient(135deg, #D4AF37 0%, #C19B2E 55%, #9A7B1C 100%)',
                        color: '#07070D',
                        fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                        cursor: 'pointer', letterSpacing: '0.02em',
                        boxShadow: ctaHover === 'primary'
                          ? '0 8px 32px rgba(212,175,55,0.55), inset 0 1px 0 rgba(255,255,255,0.25)'
                          : '0 4px 20px rgba(212,175,55,0.3),  inset 0 1px 0 rgba(255,255,255,0.18)',
                        transform: ctaHover === 'primary' ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'all 0.22s ease',
                      }}
                    >
                      Start Trading
                      <ArrowRight style={{
                        width: 16, height: 16,
                        transform: ctaHover === 'primary' ? 'translateX(3px)' : 'translateX(0)',
                        transition: 'transform 0.22s',
                      }} />
                    </button>
                  </Link>

                  {/* Ghost CTA */}
                  <Link to="/how-it-works" style={{ textDecoration: 'none' }}>
                    <button
                      onMouseEnter={() => setCtaHover('ghost')}
                      onMouseLeave={() => setCtaHover(null)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        height: 54, padding: '0 24px',
                        borderRadius: 14,
                        border: `1px solid ${ctaHover === 'ghost' ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.15)'}`,
                        background: ctaHover === 'ghost' ? 'rgba(212,175,55,0.07)' : 'transparent',
                        color: ctaHover === 'ghost' ? '#F5C518' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500,
                        cursor: 'pointer', letterSpacing: '0.01em',
                        transition: 'all 0.22s ease',
                      }}
                    >
                      How It Works
                      <ChevronRight style={{ width: 14, height: 14 }} />
                    </button>
                  </Link>
                </motion.div>

                {/* Security micro-badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginTop: 24,
                  }}
                >
                  <ShieldCheck style={{ width: 13, height: 13, color: '#4ADE80' }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10.5,
                    color: 'rgba(74,222,128,0.6)', letterSpacing: '0.05em',
                  }}>
                    Secured & Encrypted · USDT BEP20 Only
                  </span>
                </motion.div>
              </div>

              {/* ── RIGHT: Gold coin + floating UI cards ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0, 0, 0.2, 1] }}
                style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  position: 'relative', height: 460,
                }}
                className="hero-visual"
              >
                {/* Orbital ring */}
                <div style={{
                  position: 'absolute',
                  width: 360, height: 360,
                  borderRadius: '50%',
                  border: '1px solid rgba(212,175,55,0.10)',
                  boxShadow: '0 0 60px 2px rgba(212,175,55,0.08)',
                  animation: 'orbitGlow 4s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute',
                  width: 290, height: 290,
                  borderRadius: '50%',
                  border: '1px solid rgba(212,175,55,0.06)',
                }} />

                {/* Gold coin */}
                <img
                  src="/images/Hero Gold Coin.png" alt="Gold Coin"
                  style={{
                    width: 240, height: 240,
                    objectFit: 'contain', zIndex: 5,
                    animation: 'floatA 9s ease-in-out infinite, coinPulse 4s ease-in-out infinite',
                    position: 'relative',
                  }}
                />

                {/* Floating card: Live Profit */}
                <HeroWidget
                  floatDelay="0s"
                  style={{
                    position: 'absolute', top: '8%', right: '-4%',
                    zIndex: 10, animation: 'cardFloat 5s ease-in-out 0s infinite',
                  }}
                >
                  <div style={{ marginBottom: 5 }}>
                    <span style={{
                      fontFamily: 'var(--font-ui)', fontSize: 9.5, fontWeight: 600,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                    }}>Live Profit</span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 24,
                    fontWeight: 600, color: '#4ADE80',
                    letterSpacing: '-0.01em',
                  }}>$0.00</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
                  }}>
                    <TrendingUp style={{ width: 10, height: 10, color: '#4ADE80' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(74,222,128,0.6)' }}>
                      +0.5% today
                    </span>
                  </div>
                </HeroWidget>

                {/* Floating card: XAUUSD */}
                <HeroWidget
                  floatDelay="1.5s"
                  style={{
                    position: 'absolute', bottom: '10%', left: '-8%',
                    zIndex: 10, animation: 'cardFloat 6s ease-in-out 1.5s infinite',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(212,175,55,0.12)',
                      border: '1px solid rgba(212,175,55,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Bot style={{ width: 13, height: 13, color: '#D4AF37' }} />
                    </div>
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                        color: 'var(--text-bright)', letterSpacing: '0.04em',
                      }}>Live XAUUSD</div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: '#D4AF37', marginTop: 1,
                      }}>Active</div>
                    </div>
                  </div>
                </HeroWidget>

                {/* Floating card: Security */}
                <HeroWidget
                  floatDelay="0.8s"
                  style={{
                    position: 'absolute', bottom: '30%', right: '-12%',
                    zIndex: 10, animation: 'cardFloat 7s ease-in-out 0.8s infinite',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck style={{ width: 16, height: 16, color: '#4ADE80' }} />
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                        color: 'var(--text-bright)',
                      }}>Secured</div>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        color: 'rgba(74,222,128,0.6)', marginTop: 1,
                      }}>BEP20 · Encrypted</div>
                    </div>
                  </div>
                </HeroWidget>
              </motion.div>

            </div>
          </section>
        </div>

        {/* ══════════════════════════════════════════════════
            TICKER
        ══════════════════════════════════════════════════ */}
        <Ticker />

        {/* ══════════════════════════════════════════════════
            STATS SECTION
        ══════════════════════════════════════════════════ */}
        <section style={{
          maxWidth: 1280, margin: '0 auto',
          padding: 'clamp(60px, 8vw, 100px) clamp(16px, 5vw, 48px)',
        }}>
          {/* Section heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <p style={{
              fontFamily: 'var(--font-ui)', fontSize: 11,
              fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)',
              marginBottom: 12,
            }}>How It Works</p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 5vw, 58px)',
              fontWeight: 700, lineHeight: 1.05,
              color: 'var(--text-bright)',
              letterSpacing: '-0.01em',
            }}>
              Simple &<br />
              <span className="lp-gold-text">Transparent.</span>
            </h2>
          </motion.div>

          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
          }}>
            <AnimatedStat value="$50" suffix="" label="Minimum Investment" delay={0} />
            <AnimatedStat value="0.5–1" suffix="%" label="Daily Profit Range" delay={0.1} />
            <AnimatedStat value="$50" suffix="" label="Min. Withdrawal" delay={0.2} />
            <AnimatedStat value="BEP20" suffix="" label="USDT Network Only" delay={0.3} prefix="" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            FEATURES SECTION
        ══════════════════════════════════════════════════ */}
        <section style={{
          position: 'relative',
          padding: 'clamp(60px, 8vw, 100px) 0',
          overflow: 'hidden',
        }}>
          {/* Grid pattern background */}
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          }}>
            <img src="/images/Geometric Gold Grid Pattern.png" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.05, mixBlendMode: 'screen' }}
            />
            {/* Scan line effect */}
            <div style={{
              position: 'absolute', left: 0, right: 0,
              height: '30%',
              background: 'linear-gradient(180deg, transparent, rgba(212,175,55,0.025), transparent)',
              animation: 'scanUp 12s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          </div>

          <div style={{
            maxWidth: 1280, margin: '0 auto',
            padding: '0 clamp(16px, 5vw, 48px)',
            position: 'relative', zIndex: 1,
          }}>
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              style={{ textAlign: 'center', marginBottom: 60 }}
            >
              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: 11,
                fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)',
                marginBottom: 12,
              }}>Platform Features</p>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 5vw, 58px)',
                fontWeight: 700, lineHeight: 1.05,
                color: 'var(--text-bright)', letterSpacing: '-0.01em',
              }}>
                Real-Data Workflow.
              </h2>
              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: 'clamp(14px, 2vw, 18px)',
                fontWeight: 300, lineHeight: 1.6,
                color: 'var(--text-secondary)',
                maxWidth: 500, margin: '16px auto 0',
              }}>
                Built to display verified platform data only — no fabricated results, ever.
              </p>
            </motion.div>

            {/* Feature cards grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 18,
            }}>
              {FEATURES.map((f, i) => (
                <FeatureCard key={i} feature={f} index={i} />
              ))}
            </div>
          </div>
        </section>

        <HowItWorksSection />
        <ProfitCalculator />
        <InvestmentTiers />
        <TrustSection />
        <PlatformHighlights />
        <FAQSection />

        {/* ══════════════════════════════════════════════════
            BOTTOM CTA BANNER
            ══════════════════════════════════════════════════ */}
        <section style={{
          maxWidth: 1280, margin: '0 auto',
          padding: '0 clamp(16px, 5vw, 48px) clamp(60px, 8vw, 120px)',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              position: 'relative',
              borderRadius: 28,
              overflow: 'hidden',
              padding: 'clamp(40px, 6vw, 72px) clamp(24px, 5vw, 72px)',
              background: 'linear-gradient(135deg, rgba(13,12,26,0.9) 0%, rgba(8,8,15,0.95) 100%)',
              border: '1px solid rgba(212,175,55,0.18)',
              textAlign: 'center',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Ambient glow center */}
            <div aria-hidden style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 400, height: 200,
              background: 'radial-gradient(ellipse, rgba(212,175,55,0.14) 0%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />

            {/* Top border glow */}
            <div aria-hidden style={{
              position: 'absolute', top: 0, left: '20%', right: '20%',
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 999, marginBottom: 20,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
              }}>
                <Lock style={{ width: 10, height: 10, color: '#D4AF37' }} />
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'rgba(212,175,55,0.7)',
                }}>
                  Principal Locked · Profit Generated Daily
                </span>
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 58px)',
                fontWeight: 700, lineHeight: 1.05,
                letterSpacing: '-0.01em',
                marginBottom: 16,
              }}>
                <span style={{ color: 'var(--text-bright)' }}>Ready to grow</span>{' '}
                <span className="lp-gold-text">your capital?</span>
              </h2>

              <p style={{
                fontFamily: 'var(--font-ui)', fontSize: 'clamp(14px, 2vw, 17px)',
                fontWeight: 300, lineHeight: 1.65,
                color: 'var(--text-secondary)',
                maxWidth: 460, margin: '0 auto 32px',
              }}>
                Deposit starts at $50. No lock-in commitment beyond your principal.
                Withdraw profit once it hits $50.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <button
                    onMouseEnter={() => setCtaHover('banner')}
                    onMouseLeave={() => setCtaHover(null)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      height: 52, padding: '0 28px',
                      borderRadius: 14,
                      border: '1px solid rgba(212,175,55,0.25)',
                      background: ctaHover === 'banner'
                        ? 'linear-gradient(135deg, #F5C518 0%, #D4AF37 55%, #B8962E 100%)'
                        : 'linear-gradient(135deg, #D4AF37 0%, #C19B2E 55%, #9A7B1C 100%)',
                      color: '#07070D',
                      fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', letterSpacing: '0.02em',
                      boxShadow: ctaHover === 'banner'
                        ? '0 8px 32px rgba(212,175,55,0.5)'
                        : '0 4px 20px rgba(212,175,55,0.28)',
                      transform: ctaHover === 'banner' ? 'translateY(-2px)' : 'translateY(0)',
                      transition: 'all 0.22s ease',
                    }}
                  >
                    <Sparkles style={{ width: 14, height: 14 }} />
                    Get Started Free
                  </button>
                </Link>

                <Link to="/risk-disclosure" style={{ textDecoration: 'none' }}>
                  <button style={{
                    display: 'inline-flex', alignItems: 'center',
                    height: 52, padding: '0 22px',
                    borderRadius: 14,
                    border: '1px solid rgba(212,175,55,0.12)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 400,
                    cursor: 'pointer', letterSpacing: '0.01em',
                    transition: 'all 0.22s ease',
                  }}>
                    Read Risk Disclosure
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

      </div>

      {/* Hide right column (coin) on mobile */}
      <style>{`
        .hero-visual { display: none !important; }
        @media (min-width: 960px) {
          .hero-visual { display: flex !important; }
        }
      `}</style>
    </>
  );
}
