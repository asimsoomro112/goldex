import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOConfig {
  title: string;
  description: string;
}

const SEO_MAP: Record<string, SEOConfig> = {
  '/': {
    title: 'GoldEx | Gold Investment Platform – Earn Daily Profit',
    description: 'Invest in gold-linked assets with GoldEx. Deposit USDT (BEP20), earn daily profit, and withdraw when ready. All deposits verified on-chain.'
  },
  '/about': {
    title: 'About Us | GoldEx Gold Investment Platform',
    description: 'Learn about the GoldEx team, mission, and the technology behind our gold-linked daily profit platform.'
  },
  '/how-it-works': {
    title: 'How It Works | GoldEx Gold Investment',
    description: 'See how GoldEx works: deposit USDT, earn daily profit from gold price movements, and withdraw your earnings anytime after $50.'
  },
  '/pricing': {
    title: 'Investment Tiers & Plans | GoldEx',
    description: 'Explore GoldEx investment tiers: Starter, Growth, and Elite. Start investing from just $50 USDT and earn daily returns.'
  },
  '/referral': {
    title: 'Referral Program | Earn Commission | GoldEx',
    description: 'Share your referral link and earn commission on deposits made by people you invite to GoldEx.'
  },
  '/terms': {
    title: 'Terms of Service | GoldEx',
    description: 'Review the official terms of service and platform usage rules governing GoldEx investments.'
  },
  '/privacy': {
    title: 'Privacy Policy | GoldEx',
    description: 'Learn how GoldEx protects and handles your account data, transaction records, and personal information.'
  },
  '/risk-disclosure': {
    title: 'Risk Disclosure | GoldEx',
    description: 'Important risk information. Understand gold price volatility, market risks, and investment considerations.'
  },
  '/compliance': {
    title: 'Compliance & Security | GoldEx',
    description: 'GoldEx compliance standards, on-chain deposit verification, and platform security measures.'
  },
  '/fees': {
    title: 'Fees & Processing | GoldEx',
    description: 'Transparent fee structure: Standard withdrawal (8%, 24-48 hours) vs Express (12%, under 1 hour). No hidden charges.'
  },
  '/referral-policy': {
    title: 'Referral Policy | GoldEx',
    description: 'Read the guidelines and policies governing the GoldEx referral commission program.'
  },
  '/login': {
    title: 'Sign In | GoldEx',
    description: 'Log in to your GoldEx account to track earnings, manage investments, and withdraw profits.'
  },
  '/register': {
    title: 'Create Account | GoldEx',
    description: 'Sign up for a free GoldEx account. Start investing with as little as $50 USDT and earn daily profit.'
  },
  '/dashboard': {
    title: 'Dashboard | GoldEx',
    description: 'Track your balance, active investments, daily profit, and withdrawal history in real time.'
  },
  '/dashboard/invest': {
    title: 'Invest | GoldEx',
    description: 'Make a new investment, view active deposits, and track your earning progress.'
  },
  '/dashboard/profit': {
    title: 'Profit History | GoldEx',
    description: 'View your daily profit entries, historical earnings, and performance over time.'
  },
  '/dashboard/referrals': {
    title: 'My Referrals | GoldEx',
    description: 'Track your referred users and commission earnings from the GoldEx referral program.'
  },
  '/dashboard/ai-agent': {
    title: 'AI Assistant | GoldEx',
    description: 'Chat with the GoldEx AI assistant for help with your investments, profit projections, and platform questions.'
  },
  '/dashboard/withdraw': {
    title: 'Withdraw | GoldEx',
    description: 'Withdraw your accumulated profit to your BEP20 wallet or reinvest to grow your balance.'
  },
  '/dashboard/settings': {
    title: 'Account Settings | GoldEx',
    description: 'Manage your profile, security settings, and registered payout wallet addresses.'
  },
  '/dashboard/support': {
    title: 'Support | GoldEx',
    description: 'Get help with your account, deposits, withdrawals, or any platform questions.'
  },
  '/admin': {
    title: 'Admin Panel | GoldEx',
    description: 'Administrator console for deposit verification, user management, and platform operations.'
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
