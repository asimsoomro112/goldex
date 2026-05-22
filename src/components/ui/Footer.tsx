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

  :root[data-theme="light"] .footer-wrap {
    background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(245,247,251,0.98) 100%);
    color: rgba(17,24,39,0.62);
    box-shadow: inset 0 1px 0 rgba(15,23,42,0.04);
  }

  :root[data-theme="light"] .footer-title {
    color: #111827;
  }

  :root[data-theme="light"] .footer-link {
    color: rgba(17,24,39,0.64);
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
                GoldEx is a gold-linked investment platform. Deposit USDT (BEP20), earn daily profit, and withdraw when ready. All deposits are verified on-chain via BscScan.
              </p>
              <div style={{
                display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 600, color: '#4ADE80',
                  background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)',
                  padding: '5px 12px', borderRadius: 10,
                }}>
                  🔒 TLS 1.3 Encrypted
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 600, color: '#60A5FA',
                  background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
                  padding: '5px 12px', borderRadius: 10,
                }}>
                  ✓ BscScan Verified
                </span>
              </div>
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
                  <span style={{ color: 'rgba(184,176,160,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Payment Method</span>
                  <span style={{ color: '#F7F3E8' }}>USDT BEP20 (BSC Network)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
                  <span style={{ color: 'rgba(184,176,160,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Email Support</span>
                  <span style={{ color: '#F7F3E8', wordBreak: 'break-all' }}>support@goldex.io</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
                  <span style={{ color: 'rgba(184,176,160,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Withdrawals</span>
                  <span style={{ color: '#F7F3E8' }}>Admin Verified • 24-48 Hours</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
                  <span style={{ color: 'rgba(184,176,160,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Deposit Verification</span>
                  <span style={{ color: '#4ADE80' }}>On-Chain via BscScan</span>
                </div>
              </div>
            </div>

          </div>

          {/* Risk Disclaimer */}
          <div style={{
            background: 'rgba(245,197,24,0.03)',
            border: '1px solid rgba(212,175,55,0.10)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 24,
          }}>
            <p style={{ fontSize: 11, lineHeight: 1.65, color: 'rgba(184,176,160,0.55)', fontWeight: 400, margin: 0 }}>
              ⚠️ <strong style={{ color: 'rgba(212,175,55,0.6)' }}>Risk Disclaimer:</strong> Investing involves risk. Returns are estimated projections and are not guaranteed. 
              Past performance does not guarantee future results. Your deposit stays locked during the earning period. 
              Only invest what you can afford. GoldEx does not provide financial advice.
            </p>
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
