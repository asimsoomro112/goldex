import React from 'react';
import { Link } from 'react-router-dom';

const STYLES = `
  :root {
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-600: #B8962E;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui: 'Outfit', sans-serif;
  }

  .footer-wrap {
    background: linear-gradient(180deg, rgba(8,8,15,0.92) 0%, rgba(4,4,8,0.98) 100%);
    border-top: 1px solid rgba(212,175,55,0.12);
    font-family: var(--font-ui), sans-serif;
    color: rgba(184,176,160,0.65);
    position: relative;
    z-index: 10;
  }

  .footer-title {
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 600;
    color: #F7F3E8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .footer-link {
    font-size: 13px.5;
    color: rgba(184,176,160,0.7);
    text-decoration: none;
    transition: all 0.22s ease;
    display: inline-block;
  }

  .footer-link:hover {
    color: #F5C518;
    transform: translateX(2px);
  }

  .footer-glow {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 150px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }
`;

export function Footer() {
  return (
    <>
      <style>{STYLES}</style>

      <footer className="footer-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Subtle gold glow at the bottom */}
        <div className="footer-glow" />

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '80px 24px 48px',
          position: 'relative', zIndex: 1,
        }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 48,
            marginBottom: 64,
          }}>
            
            {/* Brand Column */}
            <div style={{ gridColumn: 'span 2', minWidth: 280 }}>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 20, textDecoration: 'none' }}>
                <img
                  src="/images/Navbar.png"
                  alt="GoldEx"
                  style={{
                    height: 38,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.35))',
                    transform: 'scale(1.8)',
                    transformOrigin: 'left center',
                  }}
                />
              </Link>
              <p style={{
                fontSize: 14, lineHeight: 1.65,
                color: 'rgba(184,176,160,0.72)',
                maxWidth: 480, margin: '12px 0 16px',
                fontWeight: 300,
              }}>
                GoldEx provides a live account dashboard for USDT BEP20 deposit requests, manually verified investments, and profit withdrawal tracking.
              </p>
              <p style={{
                fontSize: 12, lineHeight: 1.6,
                color: 'rgba(184,176,160,0.45)',
                maxWidth: 480, fontWeight: 300,
              }}>
                Risk notice: market-linked returns are not guaranteed. Principal remains locked while an investment is active. Profit withdrawal unlocks after the platform records eligible profit.
              </p>
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 className="footer-title">Platform</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link to="/how-it-works" className="footer-link">How It Works</Link>
                <Link to="/pricing" className="footer-link">Investment Tiers</Link>
                <Link to="/referral" className="footer-link">Referrals</Link>
                <Link to="/referral-policy" className="footer-link">Referral Policy</Link>
                <Link to="/risk-disclosure" className="footer-link">Risk Disclosure</Link>
                <Link to="/login" className="footer-link">Sign In</Link>
              </div>
            </div>

            {/* Support Column */}
            <div>
              <h3 className="footer-title">Support</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, fontWeight: 300 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'rgba(184,176,160,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Deposits</span>
                  <span style={{ color: '#F7F3E8' }}>USDT BEP20 Only</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
                  <span style={{ color: 'rgba(184,176,160,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Email Contact</span>
                  <span style={{ color: '#F7F3E8', wordBreak: 'break-all' }}>cryptoobscanner@gmail.com</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
                  <span style={{ color: 'rgba(184,176,160,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Withdrawals</span>
                  <span style={{ color: '#F7F3E8' }}>Admin Verified</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Fine Print */}
          <div style={{
            borderTop: '1px solid rgba(212,175,55,0.08)',
            paddingTop: 32,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 20,
          }}>
            <p style={{ fontSize: 12.5, fontWeight: 300, color: 'rgba(184,176,160,0.45)', margin: 0 }}>
              Copyright © {new Date().getFullYear()} GoldEx. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 24 }}>
              <Link to="/terms" className="footer-link" style={{ fontSize: 12.5 }}>Terms</Link>
              <Link to="/privacy" className="footer-link" style={{ fontSize: 12.5 }}>Privacy</Link>
              <Link to="/compliance" className="footer-link" style={{ fontSize: 12.5 }}>Compliance</Link>
              <Link to="/fees" className="footer-link" style={{ fontSize: 12.5 }}>Fees</Link>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}
