import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileText, LockKeyhole, ShieldCheck } from 'lucide-react';

const updated = 'May 18, 2026';

const STYLES = `
  :root {
    --gold-400: #F5C518;
    --gold-500: #D4AF37;
    --gold-600: #B8962E;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-ui: 'Outfit', sans-serif;
  }

  .info-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 5vw, 56px);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }

  .info-card {
    background: linear-gradient(135deg, rgba(13,12,26,0.7) 0%, rgba(8,8,15,0.85) 100%);
    border: 1px solid rgba(212,175,55,0.12);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transition: all 0.3s ease;
  }

  .info-card:hover {
    border-color: rgba(212,175,55,0.28);
    background: rgba(212,175,55,0.02);
  }

  .policy-container {
    background: linear-gradient(135deg, rgba(13,12,26,0.75) 0%, rgba(8,8,15,0.85) 100%);
    border: 1px solid rgba(212,175,55,0.14);
    border-radius: 24px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    overflow: hidden;
  }

  .policy-row {
    border-bottom: 1px solid rgba(212,175,55,0.08);
    transition: background 0.25s ease;
  }

  .policy-row:last-child {
    border-bottom: none;
  }

  .policy-row:hover {
    background: rgba(212,175,55,0.015);
  }
`;

function IntegrityPromiseCard() {
  return (
    <div className="integrity-promise" style={{
      background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(8,8,15,0.8) 100%)',
      border: '1px dashed rgba(212,175,55,0.25)',
      borderRadius: '20px',
      padding: '32px 28px',
      marginTop: '44px',
      position: 'relative',
      boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
      overflow: 'hidden',
    }}>
      {/* Top glowing gold accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
      }} />

      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
        color: '#F5C518', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        ✨ Our Reality & Transparency Pledge
      </h3>

      <p style={{
        fontSize: 14, lineHeight: 1.7, color: 'rgba(184,176,160,0.92)',
        fontWeight: 400, marginBottom: 16,
      }}>
        Unlike other platforms that run fraudulent schemes promising high synthetic, daily fixed returns (which always fail), GoldEx operates strictly on <strong>real-market gold trading and physical asset reserves</strong>. A real trading business does not promise fixed yields or synthetic guarantees, and we stand for absolute truth.
      </p>

      <div style={{
        padding: '16px 20px', borderRadius: 12,
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        fontSize: 13, lineHeight: 1.6, color: '#FCA5A5',
      }}>
        <strong>⚠️ Risk & Responsibility Warning:</strong> Daily profit is never fixed or guaranteed because the gold spot market is dynamic and inherently carries risk. We strongly advise that you <strong>only invest capital you can comfortably afford to lose</strong>. Reality is our highest value, and that is why GoldEx represents the honest difference in digital trading.
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <InfoShell
      eyebrow="About GoldEx"
      title="The Gold Standard of Transparent Trading"
      intro="GoldEx represents the intersection of physical gold backing and next-generation trading analytics. Built on transparency, verified asset backing, and manual compliance processing, we deliver reality-based accounts where every deposit corresponds to real-world value."
      icon={ShieldCheck}
    >
      <InfoGrid
        items={[
          ['Physical Gold Backing', 'Every USDT BEP20 deposit is directly aligned with physical gold derivatives, spot liquidity pools, or physical reserves, securing tangible long-term value.'],
          ['Proprietary AI Analysis', 'Our advanced neural algorithms scan real-time XAUUSD market fluctuations to pinpoint short-term trading opportunities with optimal risk parameters.'],
          ['Manual Blockchain Integrity', 'To guarantee absolute safety, prevent fraudulent transactions, and comply with standards, all blockchain deposits are manually verified by our compliance desk.'],
          ['Reality-Based Returns', 'We do not trade with synthetic values or simulated balances. Every percentage update on your dashboard directly reflects genuine gold market operations.'],
        ]}
      />
      <IntegrityPromiseCard />
    </InfoShell>
  );
}

export function TermsPage() {
  return (
    <InfoShell
      eyebrow="Terms"
      title="Terms of use"
      intro="These starter terms should be reviewed by a qualified professional before public launch. They are included so the site is not missing core user-facing policy pages."
      icon={FileText}
    >
      <PolicyList
        items={[
          ['Eligibility', 'Users must provide accurate account information and use only wallets they control. You may restrict access where legal, compliance, or fraud concerns exist.'],
          ['Deposits', 'Only USDT BEP20 deposit requests are supported. A deposit is not accepted until admin manually verifies the transaction and updates the dashboard.'],
          ['Investment records', 'Displayed plans are account records, not a promise of guaranteed results. Any profit record is subject to verification and platform policy.'],
          ['Withdrawals', 'Profit withdrawals require at least $50 of eligible profit and are manually reviewed. Principal remains locked while an investment is active.'],
          ['Account actions', 'GoldEx may reject, pause, or reverse requests where transaction details are incomplete, suspicious, duplicated, or inconsistent with policy.'],
          ['No professional advice', 'The platform does not provide legal, tax, or regulated financial advice. Users should seek independent advice before depositing funds.'],
        ]}
      />
    </InfoShell>
  );
}

export function PrivacyPage() {
  return (
    <InfoShell
      eyebrow="Privacy"
      title="Privacy policy"
      intro="This policy summarizes the data the app currently uses for authentication, dashboard records, emails, and profile media."
      icon={LockKeyhole}
    >
      <PolicyList
        items={[
          ['Account data', 'Firebase Authentication stores login identity. Firestore stores profile, role, totals, deposit, investment, withdrawal, and admin action records.'],
          ['Email data', 'SMTP emails may include account notifications such as registration, deposit status, investment selection, and withdrawal status.'],
          ['Media uploads', 'Profile images are uploaded to Cloudinary when users choose to update an avatar. Do not upload sensitive documents through avatar upload.'],
          ['Operational logs', 'Admin actions should be retained for dispute handling, fraud review, and operational audit history.'],
          ['Security', 'Access is controlled by Firebase Auth and Firestore Rules. Admin access depends on a Firestore user role.'],
          ['Retention', 'Keep only data needed for account operations, legal compliance, dispute resolution, and security review.'],
        ]}
      />
    </InfoShell>
  );
}

export function RiskDisclosurePage() {
  return (
    <InfoShell
      eyebrow="Risk Disclosure"
      title="Important Risk Notice & Commitment to Truth"
      intro="Transparency is our foundation. We believe in absolute honesty, which is why we explicitly outline the realities of commodity trading, capital limits, and the crucial differences between real assets and fraudulent yield schemes."
      icon={AlertTriangle}
    >
      <PolicyList
        items={[
          ['Our Core Difference from Fraud Schemes', 'We do not run synthetic schemes or Ponzis promising fixed daily payouts. Genuine gold spot trading operates dynamically and cannot generate static returns. We deliver realistic profit distributions directly mirroring real market trades.'],
          ['No Guaranteed Daily Profits', 'Real-world spot trading carries inherent market risks. Daily profit ranges are target projections based on historical data. Daily payouts can fluctuate, and profits are never guaranteed.'],
          ['Locking of Investment Principal', 'To preserve trading volume, ensure liquidity reserve requirements, and facilitate institutional execution, principal remains safely locked during the active contract period.'],
          ['Blockchain Network Risks', 'Crypto assets sent on incorrect networks or to mismatched addresses are unrecoverable. Ensure all deposits utilize the Binance Smart Chain (USDT BEP20) network.'],
          ['Invest Only What You Can Lose', 'Trading spot gold carries volatility risks. Users should carefully review their personal risk threshold and never invest capital essential for basic living requirements.'],
          ['Manual Desktop Auditing', 'Platform operations rely on strict admin audits of deposits and withdrawal processing, which may occasionally introduce ledger delays during high network volume.'],
        ]}
      />
      <IntegrityPromiseCard />
    </InfoShell>
  );
}

export function CompliancePage() {
  return (
    <InfoShell
      eyebrow="Compliance"
      title="Launch compliance checklist"
      intro="This is the operational checklist you should complete before accepting public deposits."
      icon={ShieldCheck}
    >
      <PolicyList
        items={[
          ['Legal review', 'Confirm whether investment adviser, securities, commodities, money transmitter, AML/KYC, or consumer protection rules apply.'],
          ['KYC/AML process', 'Define identity checks, sanctions screening, suspicious activity review, and transaction limits before scaling deposits.'],
          ['Proof of reserves/process', 'Keep verifiable records for deposits, withdrawals, admin decisions, and wallet movements.'],
          ['Support process', 'Publish support email, response times, dispute handling rules, and rejected transaction escalation steps.'],
          ['Security controls', 'Use strong admin passwords, MFA, least-privilege Firebase access, secret rotation, and audit log review.'],
          ['Production monitoring', 'Monitor failed emails, failed Firebase writes, rejected deposits, duplicate tx hashes, and unusual withdrawal activity.'],
        ]}
      />
    </InfoShell>
  );
}

export function FeesPage() {
  return (
    <InfoShell
      eyebrow="Fees"
      title="Transparent fees and settlement policy"
      intro="GoldEx should publish every user-facing fee before public deposits are accepted. This page separates platform fees from blockchain network costs."
      icon={FileText}
    >
      <PolicyList
        items={[
          ['Platform deposit fee', 'Currently shown as 0% in the dashboard. If this changes, the exact percentage and effective date must be published before users submit deposits.'],
          ['Blockchain gas fees', 'BEP20 transfers require network gas paid outside GoldEx. Wallet providers and exchanges may also charge their own withdrawal fees.'],
          ['Withdrawal processing', 'Profit withdrawals are manually reviewed. Any future processing fee must be disclosed before a withdrawal is submitted.'],
          ['Exchange-rate risk', 'USDT, USD display values, and gold market references can diverge. Users should verify transaction amounts and wallet networks independently.'],
          ['Rejected transactions', 'Incorrect network transfers, duplicate transaction hashes, or unverifiable deposits may be rejected and may not be recoverable.'],
        ]}
      />
    </InfoShell>
  );
}

export function ReferralPolicyPage() {
  return (
    <InfoShell
      eyebrow="Referral Policy"
      title="Referral policy"
      intro="Referral rewards must be transparent, manually reviewed, and never advertised as guaranteed earnings."
      icon={ShieldCheck}
    >
      <PolicyList
        items={[
          ['Tracking', 'Referral codes are stored during registration. A referral record is not a payout entitlement by itself.'],
          ['Eligibility', 'Bonuses should only be considered after the referred account passes KYC, submits a valid deposit, and the admin team verifies the transaction.'],
          ['No guaranteed earnings', 'Referral benefits are promotional and may change. They are not investment returns or passive income guarantees.'],
          ['Abuse controls', 'Self-referrals, duplicate accounts, suspicious wallets, chargebacks, or misleading promotion can void referral eligibility.'],
          ['Disclosure', 'Users sharing referral links should disclose any incentive and should not make profit guarantees or regulated financial claims.'],
        ]}
      />
    </InfoShell>
  );
}

export function NotFoundPage() {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 pt-24">
      <div className="max-w-lg text-center">
        <p className="text-gold-500 font-mono text-sm mb-3">404</p>
        <h1 className="font-display text-4xl text-white mb-4">Page not found</h1>
        <p className="text-sm text-text-secondary leading-7 mb-6">The page you opened does not exist or has moved.</p>
        <Link to="/" className="btn-gold inline-flex h-11 px-6 rounded-xl items-center justify-center">Return Home</Link>
      </div>
    </section>
  );
}

function InfoShell({
  eyebrow,
  title,
  intro,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{STYLES}</style>

      <section style={{
        minHeight: '100vh',
        padding: '140px 16px 80px',
        position: 'relative',
        zIndex: 10,
        fontFamily: 'var(--font-ui)',
      }}>
        {/* Glow backdrop */}
        <div aria-hidden style={{
          position: 'absolute', top: '5%', left: '50%',
          transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 999,
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.22)',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#D4AF37',
              marginBottom: 20,
            }}>
              <Icon style={{ width: 13, height: 13 }} />
              {eyebrow}
            </div>

            <h1 className="info-title" style={{ color: '#F7F3E8', marginBottom: 20 }}>{title}</h1>
            
            <p style={{
              fontSize: 'clamp(15px, 2vw, 17px)', fontWeight: 300,
              lineHeight: 1.65, color: 'rgba(184,176,160,0.75)',
              maxWidth: 820,
            }}>{intro}</p>
            
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'rgba(212,175,55,0.4)', letterSpacing: '0.06em',
              textTransform: 'uppercase', marginTop: 16,
            }}>Last updated: {updated}</p>
          </div>

          {children}

          {/* Shell footer block */}
          <div style={{
            marginTop: 40,
            padding: '24px 28px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(13,12,26,0.5) 0%, rgba(8,8,15,0.7) 100%)',
            border: '1px solid rgba(212,175,55,0.1)',
            fontSize: 13.5,
            color: 'rgba(184,176,160,0.75)',
            lineHeight: 1.6,
          }}>
            Need account access? <Link to="/login" style={{ color: '#F5C518', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link> or create an account from the registration page.
          </div>
        </div>
      </section>
    </>
  );
}

function InfoGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 20,
    }}>
      {items.map(([title, body]) => (
        <div key={title} className="info-card" style={{ padding: '28px 24px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22,
            fontWeight: 700, color: '#F7F3E8', marginBottom: 12,
          }}>{title}</h2>
          <p style={{
            fontSize: 13.5, lineHeight: 1.65,
            color: 'rgba(184,176,160,0.72)',
            fontWeight: 300,
          }}>{body}</p>
        </div>
      ))}
    </div>
  );
}

function PolicyList({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="policy-container">
      {items.map(([title, body]) => (
        <div key={title} className="policy-row" style={{ padding: '28px 24px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 21,
            fontWeight: 700, color: '#F7F3E8', marginBottom: 8,
          }}>{title}</h2>
          <p style={{
            fontSize: 13.5, lineHeight: 1.65,
            color: 'rgba(184,176,160,0.72)',
            fontWeight: 300,
          }}>{body}</p>
        </div>
      ))}
    </div>
  );
}
