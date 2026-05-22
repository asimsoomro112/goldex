import React, { useState } from 'react';
import { Check, ArrowRight, HelpCircle, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STYLES = `
  :root {
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-600: #B8962E;
    --surface-950: #05050E;
    --surface-900: #08080F;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui: 'Outfit', sans-serif;

    --tier-starter: #D4AF37;
    --tier-growth: #F472B6;
    --tier-elite: #60A5FA;
  }

  :root[data-theme="light"] {
    --tier-starter: #8B6914;
    --tier-growth: #BE185D;
    --tier-elite: #1D4ED8;
  }

  .pricing-title {
    font-family: var(--font-display);
    font-size: clamp(40px, 6vw, 76px);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.01em;
  }

  .tier-card {
    background: var(--glass-2);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
    box-shadow: var(--shadow-card);
  }

  .tier-card:hover {
    border-color: var(--gb-hover);
    box-shadow: var(--shadow-float), var(--glow-sm);
    transform: translateY(-5px);
  }

  .faq-card {
    background: var(--glass-2);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    transition: all 0.25s ease;
  }

  .faq-card:hover {
    border-color: var(--gb-hover);
    background: var(--glass-hover);
  }
`;

const PLANS = [
  {
    name: 'Starter',
    range: '$50 - $450',
    accentColor: 'var(--tier-starter)',
    img: '/images/Starter.png',
    features: [
      'Invest $50, $100, or any $50 multiple',
      '0.5% - 1.0% daily profit range',
      'Principal remains locked',
      'Profit withdrawal after $50 minimum',
    ],
    cta: 'Start with $50',
  },
  {
    name: 'Growth',
    range: '$500 - $4,950',
    accentColor: 'var(--tier-growth)',
    img: '/images/Growth.png',
    features: [
      'Invest any $50 multiple from $500',
      '1.0% - 1.2% daily profit range',
      'Higher yield than Starter tier',
      'Priority AI data feed',
    ],
    cta: 'Select Growth Tier',
  },
  {
    name: 'Elite',
    range: '$5,000+',
    accentColor: 'var(--tier-elite)',
    img: '/images/Elite.png',
    features: [
      'Invest any $50 multiple from $5,000',
      '1.2% - 1.5% daily profit range',
      'Highest yield tier available',
      'Advanced profit tracking',
    ],
    cta: 'Select Elite Tier',
  },
];

const FAQS = [
  { q: 'Is there a free trial?', a: 'No. The minimum verified deposit is $50.' },
  { q: 'How is profit calculated?', a: 'Daily profit is calculated on the locked investment amount. Starter tier earns 0.5%–1.0%, Growth tier earns 1.0%–1.2%, and Elite tier earns 1.2%–1.5% daily.' },
  { q: 'When can profit be withdrawn?', a: 'Profit can be withdrawn after accumulated profit reaches at least $50. After withdrawal settlement, that investment stops generating profit.' },
  { q: 'Which deposit method is supported?', a: 'Only USDT on BEP20 is supported.' },
];

export function PricingPage() {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

        {/* ── Background flow banner ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <img
            src="/images/Abstract Gold Flow (Pricing Section BG).png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.16, mixBlendMode: 'screen' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 50%, rgba(5,5,14,0.95) 100%)',
          }} />
        </div>

        {/* ── Header Area ── */}
        <section style={{
          padding: '140px 16px 60px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pricing-title"
              style={{ color: 'var(--text-bright)', marginBottom: 20 }}
            >
              Investment <span style={{
                background: 'linear-gradient(135deg, #FFD97D 0%, #F5C518 35%, #D4AF37 65%, #9A7B1C 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Tiers</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: 'clamp(15px, 2vw, 18px)', fontWeight: 300,
                lineHeight: 1.6, color: 'var(--text-secondary)',
                maxWidth: 680, margin: '0 auto',
              }}
            >
              Invest $50, $100, or any $50 multiple. Principal stays locked, daily profit ranges from 0.5% up to 1.5% based on your tier, and profit withdrawal unlocks after $50.
            </motion.p>
          </div>
        </section>

        {/* ── Tiers Grid ── */}
        <section style={{
          maxWidth: 1140, margin: '0 auto',
          padding: '0 24px 100px',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32,
            alignItems: 'stretch',
          }}>
            {PLANS.map((plan, i) => {
              const isHovered = hoveredTier === i;

              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.55 }}
                  className="tier-card"
                  onMouseEnter={() => setHoveredTier(i)}
                  onMouseLeave={() => setHoveredTier(null)}
                >
                  {/* Color bar top accent */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${plan.accentColor}, transparent)`,
                    opacity: isHovered ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                  }} />

                  {/* Visual card header image */}
                  <div style={{
                    position: 'relative', height: 160, background: '#05050A',
                    overflow: 'hidden', borderBottom: '1px solid rgba(212,175,55,0.08)'
                  }}>
                    <img
                      src={plan.img}
                      alt=""
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        opacity: isHovered ? 0.35 : 0.22,
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                    {/* Dark gradient overlap */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to bottom, rgba(5,5,14,0.1) 0%, rgba(5,5,14,0.85) 100%)',
                    }} />

                    {/* Tier Name Title inside visual block */}
                    <div style={{
                      position: 'absolute', bottom: 16, left: 24, right: 24,
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10,
                        fontWeight: 600, color: plan.accentColor,
                        textTransform: 'uppercase', letterSpacing: '0.12em',
                        display: 'block', marginBottom: 2,
                      }}>Investment Tier</span>
                      <h3 style={{
                        fontFamily: 'var(--font-display)', fontSize: 26,
                        fontWeight: 700, color: 'var(--text-bright)', lineHeight: 1.1,
                      }}>{plan.name}</h3>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}>
                    {/* Range Header */}
                    <div style={{
                      marginBottom: 28,
                      paddingBottom: 20,
                      borderBottom: '1px solid rgba(212,175,55,0.08)',
                    }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 'clamp(22px, 3vw, 26px)',
                        fontWeight: 600, color: 'var(--gold-500)',
                        letterSpacing: '-0.01em',
                      }}>{plan.range}</div>
                      <span style={{
                        fontSize: 11, color: 'var(--text-muted)',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        marginTop: 4, display: 'block',
                      }}>Verified deposit range</span>
                    </div>

                    {/* Features List */}
                    <div style={{ flex: 1 }}>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                        {plan.features.map((feat) => (
                          <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: 'color-mix(in srgb, var(--profit) 12%, transparent)',
                              border: '1px solid color-mix(in srgb, var(--profit) 22%, transparent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              marginTop: 2, flexShrink: 0,
                            }}>
                              <Check style={{ width: 10, height: 10, color: 'var(--profit)' }} />
                            </div>
                            <span style={{
                              fontSize: 13, lineHeight: 1.45,
                              color: 'var(--text-primary)',
                              fontWeight: 300,
                            }}>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <Link to="/register" style={{ textDecoration: 'none', marginTop: 'auto', display: 'block' }}>
                      <button
                        style={{
                          width: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          height: 50, borderRadius: 12,
                          fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', letterSpacing: '0.01em',
                          transition: 'all 0.22s ease',

                          ...(isHovered ? {
                            border: `1px solid color-mix(in srgb, ${plan.accentColor} 25%, transparent)`,
                            background: plan.accentColor,
                            color: 'var(--b-900)',
                            boxShadow: `0 6px 20px color-mix(in srgb, ${plan.accentColor} 18%, transparent)`,
                            fontWeight: 700,
                          } : {
                            border: '1px solid color-mix(in srgb, var(--gold-500) 15%, transparent)',
                            background: 'color-mix(in srgb, var(--gold-500) 4%, transparent)',
                            color: 'var(--text-secondary)',
                          }),
                        }}
                      >
                        {plan.cta}
                        <ArrowRight style={{ width: 13, height: 13 }} />
                      </button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── FAQ Section (Interactive Accordion) ── */}
        <section style={{
          maxWidth: 760, margin: '0 auto',
          padding: '0 24px 120px',
          position: 'relative',
          zIndex: 1,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700, color: '#F7F3E8', textAlign: 'center',
            marginBottom: 48, letterSpacing: '0.01em',
          }}>Frequently Asked Questions</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;

              return (
                <div
                  key={faq.q}
                  className="faq-card"
                  style={{ overflow: 'hidden' }}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', padding: '20px 24px',
                      background: 'transparent', border: 'none',
                      textAlign: 'left', cursor: 'pointer', color: '#F7F3E8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <HelpCircle style={{ width: 18, height: 18, color: '#D4AF37', flexShrink: 0 }} />
                      <span style={{ fontSize: 14.5, fontWeight: 500, fontFamily: 'var(--font-ui)' }}>{faq.q}</span>
                    </div>
                    <ChevronDown style={{
                      width: 16, height: 16, color: 'rgba(212,175,55,0.5)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease',
                      flexShrink: 0,
                    }} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div style={{
                          padding: '0 24px 22px 54px',
                          fontSize: 13.5, lineHeight: 1.65,
                          color: 'rgba(184,176,160,0.78)',
                          fontWeight: 300,
                        }}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </>
  );
}
