import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, UserPlus, Wallet, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';

const STYLES = `
  :root {
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-600: #B8962E;
    --surface-950: #05050E;
    --surface-900: #08080F;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui: 'Outfit', sans-serif;

    --step-1: #60A5FA;
    --step-2: #D4AF37;
    --step-3: #F472B6;
    --step-4: #4ADE80;
  }

  :root[data-theme="light"] {
    --step-1: #1D4ED8;
    --step-2: #8B6914;
    --step-3: #DB2777;
    --step-4: #047857;
  }

  @keyframes cardFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }

  .how-title {
    font-family: var(--font-display);
    font-size: clamp(40px, 6vw, 76px);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .how-card {
    background: var(--glass-2);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: var(--shadow-card);
  }

  .how-card:hover {
    border-color: var(--gb-hover);
    box-shadow: var(--shadow-float);
    transform: translateY(-5px);
  }
`;

const STEPS = [
  {
    num: '01',
    label: 'Create Account',
    icon: UserPlus,
    img: '/images/Create Account.png',
    accentColor: 'var(--step-1)',
    desc: 'Sign up to gain access to our secure platform. Every user account is secured by our enterprise-grade cryptographic authentication protocols to ensure maximum data privacy and protection.',
  },
  {
    num: '02',
    label: 'Fund Wallet (USDT BEP20)',
    icon: Wallet,
    img: '/images/Invest $50.png',
    accentColor: 'var(--step-2)',
    desc: 'Deposit a minimum of $50 using USDT (BEP20). Your capital is securely locked and verified by our admins, granting you immediate access to our live trading pools.',
  },
  {
    num: '03',
    label: 'AI Trading Execution',
    icon: Sparkles,
    img: '/images/Step 3 — AI Trades Gold.png',
    accentColor: 'var(--step-3)',
    desc: 'Our Claude-powered AI engine analyzes thousands of market data points on the XAUUSD pair, executing high-probability trades with a strict drawdown limit.',
  },
  {
    num: '04',
    label: 'Daily Profit Withdrawal',
    icon: TrendingUp,
    img: '/images/Step 4 Earn Daily Profits.png',
    accentColor: 'var(--step-4)',
    desc: 'Sit back and watch your dashboard as you accumulate daily profits ranging from 0.5% to 1.0%. Once your profits cross the $50 threshold, you can withdraw directly.',
  },
];

export function HowItWorksPage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [btnHover, setBtnHover] = useState(false);

  return (
    <>
      <style>{STYLES}</style>

      <div style={{
        width: '100%', flex: 1,
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-primary)',
        background: 'transparent',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* ── Header Area ── */}
        <section style={{
          padding: '140px 16px 60px',
          textAlign: 'center',
          position: 'relative',
        }}>
          {/* Subtle glow */}
          <div aria-hidden style={{
            position: 'absolute', top: '10%', left: '50%',
            transform: 'translateX(-50%)',
            width: 450, height: 250, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                marginBottom: 20,
              }}
            >
              <ShieldCheck style={{ width: 13, height: 13, color: 'var(--gold-500)' }} />
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--gold-500)',
              }}>Execution Mechanism</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="how-title"
              style={{ color: 'var(--text-bright)', marginBottom: 20 }}
            >
              How <span style={{
                background: 'var(--grad-gold-text)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>GoldEx</span> Works
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 300,
                lineHeight: 1.6, color: 'var(--text-secondary)',
                maxWidth: 620, margin: '0 auto',
              }}
            >
              An inside look at our AI-driven gold trading execution flow. Secure deposits, Claude-assisted optimization, and automatic dashboard records.
            </motion.p>
          </div>
        </section>

        {/* ── Steps Grid Section ── */}
        <section style={{
          maxWidth: 1100, margin: '0 auto',
          padding: '0 24px 80px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 36,
          }}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isHovered = hoveredCard === i;

              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.08 }}
                  className="how-card"
                  onMouseEnter={() => setHoveredCard(i)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Color bar top accent */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${step.accentColor}, transparent)`,
                    opacity: isHovered ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                  }} />

                  {/* Corner glow */}
                  <div style={{
                    position: 'absolute', top: -30, left: -30,
                    width: 100, height: 100, borderRadius: '50%',
                    background: `radial-gradient(circle, color-mix(in srgb, ${step.accentColor} 9%, transparent), transparent)`,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.35s',
                    pointerEvents: 'none',
                  }} />

                  {/* Step Image */}
                  <div style={{
                    position: 'relative',
                    background: 'var(--surface-950)',
                    overflow: 'hidden',
                    borderBottom: '1px solid var(--glass-border)',
                  }}>
                    <img
                      src={step.img}
                      alt={step.label}
                      style={{
                        width: '100%', height: 'auto',
                        display: 'block', opacity: 0.78,
                        transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ padding: '28px 24px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      marginBottom: 16,
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 12,
                        background: `linear-gradient(135deg, color-mix(in srgb, ${step.accentColor} 13%, transparent) 0%, color-mix(in srgb, ${step.accentColor} 3%, transparent) 100%)`,
                        border: `1px solid color-mix(in srgb, ${step.accentColor} 15%, transparent)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: step.accentColor,
                      }}>
                        <Icon style={{ width: 18, height: 18 }} />
                      </div>
                      <div>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 22, fontWeight: 700,
                          color: 'var(--text-bright)', display: 'block',
                        }}>
                          <span style={{ color: step.accentColor, marginRight: 6 }}>{step.num}.</span>
                          {step.label}
                        </span>
                      </div>
                    </div>

                    <p style={{
                      fontSize: 13.5, lineHeight: 1.65,
                      color: 'var(--text-secondary)',
                      fontWeight: 300,
                    }}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Call to Action ── */}
        <section style={{
          textAlign: 'center',
          padding: '20px 16px 120px',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 54, padding: '0 32px',
                  borderRadius: 14,
                  border: '1px solid rgba(212,175,55,0.3)',
                  background: btnHover
                    ? 'linear-gradient(135deg, var(--gold-400) 0%, var(--gold-500) 55%, var(--gold-600) 100%)'
                    : 'linear-gradient(135deg, var(--gold-500) 0%, var(--gold-600) 100%)',
                  color: 'var(--b-900)',
                  fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.02em',
                  boxShadow: btnHover
                    ? 'var(--shadow-btn)'
                    : '0 4px 20px rgba(212,175,55,0.3),  inset 0 1px 0 rgba(255,255,255,0.18)',
                  transform: btnHover ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 0.22s ease',
                }}
              >
                Start Trading Securely
                <ArrowRight style={{
                  width: 16, height: 16,
                  transform: btnHover ? 'translateX(3px)' : 'translateX(0)',
                  transition: 'transform 0.22s',
                }} />
              </button>
            </Link>
          </motion.div>
        </section>

      </div>
    </>
  );
}
