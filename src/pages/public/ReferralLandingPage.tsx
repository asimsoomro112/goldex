import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Share2, Users, Coins, Sparkles, ShieldCheck } from 'lucide-react';

const STYLES = `
  :root {
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-600: #B8962E;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui: 'Outfit', sans-serif;

    --ref-1: #60A5FA;
    --ref-2: #D4AF37;
    --ref-3: #4ADE80;
  }

  :root[data-theme="light"] {
    --ref-1: #1D4ED8;
    --ref-2: #8B6914;
    --ref-3: #047857;
  }

  .ref-title {
    font-family: var(--font-display);
    font-size: clamp(40px, 6vw, 76px);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .ref-container {
    background: var(--glass-2);
    border: 1px solid var(--glass-border);
    border-radius: 32px;
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  .ref-step-card {
    background: var(--glass-3);
    border: 1px solid var(--glass-border);
    border-radius: 20px;
    padding: 24px;
    transition: all 0.3s ease;
  }

  .ref-step-card:hover {
    border-color: var(--gb-hover);
    background: var(--glass-hover);
    transform: translateY(-2px);
  }
`;

const STEPS = [
  {
    num: '1',
    title: 'Create Account',
    text: 'Your account must exist before a referral link can be generated.',
    icon: Users,
    color: 'var(--ref-1)',
  },
  {
    num: '2',
    title: 'Share Live Link',
    text: 'Referral links are generated from verified live account data only.',
    icon: Share2,
    color: 'var(--ref-2)',
  },
  {
    num: '3',
    title: 'Accumulate Rewards',
    text: 'Track commission history securely as payments are processed.',
    icon: Coins,
    color: 'var(--ref-3)',
  },
];

export function ReferralLandingPage() {
  const [btnHover, setBtnHover] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

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
          {/* Ambient Glow */}
          <div aria-hidden style={{
            position: 'absolute', top: '15%', left: '50%',
            transform: 'translateX(-50%)',
            width: 500, height: 250, borderRadius: '50%',
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
              <Sparkles style={{ width: 13, height: 13, color: 'var(--gold-500)' }} />
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--gold-500)',
              }}>Invite & Earn</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="ref-title"
              style={{ color: 'var(--text-bright)', marginBottom: 20 }}
            >
              Referral <span style={{
                background: 'var(--grad-gold-text)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Program</span>
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
              Referral links, tier status, and verified network rewards are displayed directly from live secure account records.
            </motion.p>
          </div>
        </section>

        {/* ── Network Illustration & Steps ── */}
        <section style={{
          maxWidth: 1000, margin: '0 auto',
          padding: '0 24px 80px',
        }}>
          <div className="ref-container" style={{ position: 'relative' }}>
            
            {/* Visual Node Graph illustration */}
            <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: 'var(--surface-950)' }}>
              <img
                src="/images/Referral Hero Visual.png"
                alt="Referral Network Nodes"
                style={{
                  width: '100%', height: 'auto',
                  maxHeight: 460, objectFit: 'contain',
                  margin: '0 auto', display: 'block', opacity: 0.85,
                  padding: '24px 0',
                }}
              />
              
              {/* Clickable Overlay over baked-in CTA in graphic center */}
              <Link
                to="/register"
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 170, height: 50,
                  borderRadius: 12,
                  zIndex: 10,
                  cursor: 'pointer',
                }}
                title="Register Now"
              />
            </div>

            {/* Steps Area */}
            <div style={{
              padding: '40px 32px',
              borderTop: '1px solid var(--glass-border)',
              background: 'var(--glass-2)',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 24,
              }}>
                {STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isHovered = hoveredStep === idx;

                  return (
                    <div
                      key={step.num}
                      className="ref-step-card"
                      onMouseEnter={() => setHoveredStep(idx)}
                      onMouseLeave={() => setHoveredStep(null)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      {/* Step Badge */}
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: isHovered 
                          ? `color-mix(in srgb, ${step.color} 13%, transparent)` 
                          : 'color-mix(in srgb, var(--gold-500) 6%, transparent)',
                        border: isHovered 
                          ? `1px solid color-mix(in srgb, ${step.color} 25%, transparent)` 
                          : '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 16, color: isHovered ? step.color : 'var(--gold-500)',
                        transition: 'all 0.3s ease',
                      }}>
                        <Icon style={{ width: 18, height: 18 }} />
                      </div>

                      <h3 style={{
                        fontFamily: 'var(--font-display)', fontSize: 20,
                        fontWeight: 700, color: 'var(--text-bright)', marginBottom: 8,
                      }}>{step.title}</h3>

                      <p style={{
                        fontSize: 13, lineHeight: 1.55,
                        color: 'var(--text-secondary)',
                        fontWeight: 300,
                      }}>{step.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ── Call to Action ── */}
        <section style={{
          textAlign: 'center',
          padding: '0 16px 120px',
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
                Join Referral Network
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
