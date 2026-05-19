import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title: string;
  description: string;
}

const SEO_MAP: Record<string, SEOConfig> = {
  '/': {
    title: 'GoldEx | AI-Powered Gold Trading & Yield Arbitrage',
    description: 'Maximize your wealth with GoldEx, the premier AI-powered gold trading and automated arbitrage platform. Benefit from instant yield, smart compound reinvesting, and institutional-grade security.'
  },
  '/about': {
    title: 'About Us | Institutional Gold Arbitrage | GoldEx',
    description: 'Discover the team, technologies, and institutional liquidity sources driving the GoldEx AI gold trading and arbitrage algorithms.'
  },
  '/how-it-works': {
    title: 'How It Works | AI Gold Arbitrage System | GoldEx',
    description: 'Learn how GoldEx AI agents identify gold market discrepancies and arbitrage price spreads in milliseconds to secure daily yields.'
  },
  '/pricing': {
    title: 'Pricing & Investment Plans | GoldEx Yield Suite',
    description: 'Explore the GoldEx pricing plans: Starter, Growth, and Elite. Invest principal starting from $50 and earn 0.5% - 1.5% daily yields.'
  },
  '/referral': {
    title: 'Referral Program | Compound Affiliate Commissions | GoldEx',
    description: 'Share your unique referral link to earn dynamic commission rewards on your invitees deposits and active portfolios.'
  },
  '/terms': {
    title: 'Terms of Service | Legal Terms & Agreements | GoldEx',
    description: 'Review the official terms of service, platform usage rules, and agreements governing GoldEx investments.'
  },
  '/privacy': {
    title: 'Privacy Policy | Data Protection & Security | GoldEx',
    description: 'Learn how GoldEx protects, encrypts, and handles your user account credentials, transaction logs, and personal information.'
  },
  '/risk-disclosure': {
    title: 'Risk Disclosure Statement | Safe Trading Guide | GoldEx',
    description: 'Important risk disclosure details. Understand gold price volatility, market risks, and platform security declarations.'
  },
  '/compliance': {
    title: 'Regulatory Compliance & Audits | GoldEx Security',
    description: 'GoldEx operates with complete compliance standards, external audits, and smart contract verification for ultimate transparency.'
  },
  '/fees': {
    title: 'Fees & Processing Speeds | Transparent Structure | GoldEx',
    description: 'Understand the standard processing fee (8% in 24-48 hours) versus express fee (12% in under 1 hour) and 0% compounding reinvestments.'
  },
  '/referral-policy': {
    title: 'Referral Terms & Policy Guidelines | GoldEx Affiliate',
    description: 'Read the guidelines, policies, and anti-abuse protocols governing the GoldEx affiliate reward program.'
  },
  '/login': {
    title: 'Sign In | Access Your GoldEx Account Dashboard',
    description: 'Securely log in to your GoldEx portfolio manager to track live earnings, settle portfolios, or compound yields.'
  },
  '/register': {
    title: 'Create Account | Join GoldEx Yield Arbitrage Suite',
    description: 'Sign up for a free account today. Start investing with as little as $50 and watch your gold assets compound daily.'
  },
  '/dashboard': {
    title: 'Dashboard Overview | GoldEx Wealth Manager',
    description: 'Track your total balance, active locked principal, withdrawable profit ledger, and recent financial transactions in real time.'
  },
  '/dashboard/invest': {
    title: 'Live Portfolios & Active Investments | GoldEx Assets',
    description: 'View active portfolios, monitor daily profit ranges, and settle active investments to withdraw accrued yields.'
  },
  '/dashboard/profit': {
    title: 'Daily Yield History & Performance Ledger | GoldEx Ledger',
    description: 'Analyze complete daily profit distributions, historical performance charts, and direct ledger logs.'
  },
  '/dashboard/referrals': {
    title: 'My Affiliates & Commission Earnings | GoldEx Partners',
    description: 'Track your referred users, monitor team volumes, and inspect received affiliate commission rewards.'
  },
  '/dashboard/ai-agent': {
    title: 'GoldEx AI Trading Agent | Real-time Market Arbitrage',
    description: 'Interact with our advanced AI trading engine to view real-time gold price feed analysis and bot logs.'
  },
  '/dashboard/withdraw': {
    title: 'Withdraw & Compound Reinvest | GoldEx Gateway',
    description: 'Settle and withdraw profits to your BEP20 wallet or compound reinvest to increase your active principal by +5%.'
  },
  '/dashboard/settings': {
    title: 'Security & Account Settings | GoldEx Profile',
    description: 'Manage Google Authenticator 2FA, update personal details, verify KYC status, and register approved payout addresses.'
  },
  '/dashboard/support': {
    title: 'Help Desk & Technical Support Hub | GoldEx Support',
    description: 'Submit technical inquiries or open support tickets to connect with our dedicated customer experience staff.'
  },
  '/admin': {
    title: 'Admin Operations Control Center | GoldEx Core',
    description: 'Institutional-grade administrator console for deposit audits, KYC verification, global yield distributions, and support management.'
  }
};

export function useSEO() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Find matched config or fallback to default
    const currentConfig = SEO_MAP[pathname] || SEO_MAP['/'];

    // Update Document Title
    document.title = currentConfig.title;

    // Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', currentConfig.description);

    // Update Open Graph Tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', currentConfig.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', currentConfig.description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', `https://goldex.io${pathname}`);

    // Update Twitter/X Tags
    let twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('property', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', currentConfig.title);

    let twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (!twitterDescription) {
      twitterDescription = document.createElement('meta');
      twitterDescription.setAttribute('property', 'twitter:description');
      document.head.appendChild(twitterDescription);
    }
    twitterDescription.setAttribute('content', currentConfig.description);

  }, [pathname]);
}
