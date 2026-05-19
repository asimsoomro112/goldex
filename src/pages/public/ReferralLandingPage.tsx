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
  }

  .ref-title {
    font-family: var(--font-display);
    font-size: clamp(40px, 6vw, 76px);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .ref-container {
    background: linear-gradient(135deg, rgba(13,12,26,0.75) 0%, rgba(8,8,15,0.85) 100%);
    border: 1px solid rgba(212,175,55,0.12);
    border-radius: 32px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.6);
    overflow: hidden;
  }

  .ref-step-card {
    background: linear-gradient(135deg, rgba(13,12,26,0.6) 0%, rgba(8,8,15,0.8) 100%);
    border: 1px solid rgba(212,175,55,0.08);
    border-radius: 20px;
    padding: 24px;
    transition: all 0.3s ease;
  }

  .ref-step-card:hover {
    border-color: rgba(212,175,55,0.25);
    background: rgba(212,175,55,0.02);
    transform: translateY(-2px);
  }
`;

const STEPS = [
  {
    num: '1',
    title: 'Create Account',
    text: 'Your account must exist before a referral link can be generated.',
    icon: Users,
    color: '#60A5FA',
  },
  {
    num: '2',
    title: 'Share Live Link',
    text: 'Referral links are generated from verified live account data only.',
    icon: Share2,
    color: '#D4AF37',
  },
  {
    num: '3',
    title: 'Accumulate Rewards',
    text: 'Track commission history securely as payments are processed.',
    icon: Coins,
    color: '#4ADE80',
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
        color: '#F7F3E8',
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
              <Sparkles style={{ width: 13, height: 13, color: '#D4AF37' }} />
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#D4AF37',
              }}>Invite & Earn</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="ref-title"
              style={{ color: '#F7F3E8', marginBottom: 20 }}
            >
              Referral <span style={{
                background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 65%, #9A7B1C 100%)',
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
                lineHeight: 1.6, color: 'rgba(184,176,160,0.75)',
                maxWidth: 620, margin: '0 auto',
              }}
            >
              Referral links, tier status, and verified network rewards are displayed directly from live Firestore account records.
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
            <div style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#05050A' }}>
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
              borderTop: '1px solid rgba(212,175,55,0.08)',
              background: 'rgba(9,9,18,0.3)',
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
                        background: isHovered ? `${step.color}22` : 'rgba(212,175,55,0.06)',
                        border: isHovered ? `1px solid ${step.color}35` : '1px solid rgba(212,175,55,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 16, color: isHovered ? step.color : '#D4AF37',
                        transition: 'all 0.3s ease',
                      }}>
                        <Icon style={{ width: 18, height: 18 }} />
                      </div>

                      <h3 style={{
                        fontFamily: 'var(--font-display)', fontSize: 20,
                        fontWeight: 700, color: '#F7F3E8', marginBottom: 8,
                      }}>{step.title}</h3>

                      <p style={{
                        fontSize: 13, lineHeight: 1.55,
                        color: 'rgba(184,176,160,0.7)',
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
                    ? 'linear-gradient(135deg, #F5C518 0%, #D4AF37 55%, #B8962E 100%)'
                    : 'linear-gradient(135deg, #D4AF37 0%, #C19B2E 55%, #9A7B1C 100%)',
                  color: '#07070D',
                  fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.02em',
                  boxShadow: btnHover
                    ? '0 8px 32px rgba(212,175,55,0.55), inset 0 1px 0 rgba(255,255,255,0.25)'
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
