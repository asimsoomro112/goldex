import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Wallet, 
  TrendingUp, 
  HandCoins, 
  Bot, 
  MoveRight, 
  Sparkles, 
  Users, 
  Coins, 
  Copy, 
  ArrowUpRight,
  TrendingDown,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { 
  MIN_PROFIT_WITHDRAWAL, 
  useDashboardData, 
  useLedgerEntries, 
  getTierForAmount, 
  useReferredUsers 
} from '@/lib/dashboardData';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';
import { toast } from 'react-hot-toast';

const GOLD_PRICE_REFRESH_MS = 15000;

type GoldPrice = {
  price: number | null;
  source: string;
  updatedAt: string;
};

// CountUp animator for financial numbers
const CountUp = ({ value, duration = 0.8 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }

    const totalMiliseconds = duration * 1000;
    const stepTime = 25; // ms interval
    const steps = totalMiliseconds / stepTime;
    const increment = (end - start) / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
};

// Trust banner - simple status bar
const TrustBanner = () => {
  return (
    <div className="w-full bg-emerald-500/5 dark:bg-emerald-500/5 border-y border-emerald-500/15 dark:border-emerald-500/10 py-2.5 px-4">
      <div className="flex items-center justify-center gap-6 flex-wrap text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Platform Active
        </span>
        <span className="inline-flex items-center gap-1.5">
          🔒 Deposits Verified On-Chain
        </span>
        <span className="inline-flex items-center gap-1.5">
          📊 Live Gold Price Tracking
        </span>
      </div>
    </div>
  );
};

export function DashboardHome() {
  const [chartPeriod, setChartPeriod] = useState('7D');
  const [activeChartTab, setActiveChartTab] = useState<'profit-history' | 'live-chart'>('profit-history');
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null);
  const [liveChartEnabled, setLiveChartEnabled] = useState(false);
  const { user } = useAuth();
  
  const { investments, deposits, withdrawals, totals, profile, loading } = useDashboardData(user?.uid);
  const { entries: ledgerEntries } = useLedgerEntries(user?.uid, 100);
  const { referredUsers } = useReferredUsers(profile?.referralCode);

  const hasLiveData = investments.length > 0;

  // Total Portfolio Value is Locked Principal + Withdrawable Profits
  const totalPortfolioValue = useMemo(() => {
    return totals.lockedPrincipal + totals.withdrawableProfit;
  }, [totals]);

  // Account tier calculation
  const activeTier = useMemo(() => {
    const principal = totals.lockedPrincipal;
    if (principal >= 5000) return 'Elite';
    if (principal >= 500) return 'Growth';
    if (principal >= 50) return 'Starter';
    return 'Starter'; // Default or none
  }, [totals.lockedPrincipal]);

  // Total Withdrawals paid out
  const totalWithdrawalsPaid = useMemo(() => {
    return withdrawals
      .filter((w) => w.status === 'paid')
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);
  }, [withdrawals]);

  // Chart profit calculations
  const chartData = useMemo(() => {
    const profitEntries = ledgerEntries.filter(entry => entry.type === 'profit_added');
    let runningSum = 0;
    const accumulatedDataMap: Record<string, number> = {};

    [...profitEntries].reverse().forEach(entry => {
      const date = entry.createdAt?.toDate
        ? entry.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '-';
      runningSum += entry.amount || 0;
      accumulatedDataMap[date] = runningSum;
    });

    return Object.entries(accumulatedDataMap).map(([date, profit]) => ({
      date,
      profit: parseFloat(profit.toFixed(2)),
    }));
  }, [ledgerEntries]);

  const filteredChartData = useMemo(() => {
    if (chartData.length === 0) return [];
    let limitCount = 7;
    if (chartPeriod === '30D') limitCount = 30;
    else if (chartPeriod === '90D') limitCount = 90;
    else if (chartPeriod === 'ALL') return chartData;
    return chartData.slice(-limitCount);
  }, [chartData, chartPeriod]);

  // Gold price fetcher
  useEffect(() => {
    let mounted = true;
    let controller: AbortController | null = null;

    const fetchPrice = () => {
      if (document.hidden) return;
      controller?.abort();
      controller = new AbortController();
      fetch('/api/gold-price', { cache: 'no-store', signal: controller.signal })
        .then((response) => response.json())
        .then((data) => {
          if (mounted) setGoldPrice(data);
        })
        .catch((error) => {
          if (mounted && error?.name !== 'AbortError') setGoldPrice(null);
        });
    };

    fetchPrice();
    const interval = window.setInterval(fetchPrice, GOLD_PRICE_REFRESH_MS);
    const onVisibilityChange = () => {
      if (!document.hidden) fetchPrice();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted = false;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // TradingView widget integration
  useEffect(() => {
    if (!liveChartEnabled || activeChartTab !== 'live-chart') return;

    let cancelled = false;
    let initTimer = 0;
    const containerId = "tradingview_gold_chart";

    const initWidget = () => {
      if (cancelled) return;
      const container = document.getElementById(containerId);
      if (container && (window as any).TradingView && container.dataset.ready !== 'true') {
        const isMobile = window.innerWidth < 640;
        container.innerHTML = '';
        container.dataset.ready = 'true';
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: "OANDA:XAUUSD",
          interval: isMobile ? "D" : "60",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: true,
          hide_top_toolbar: isMobile,
          allow_symbol_change: false,
          container_id: containerId,
          studies: [],
          backgroundColor: "#0F0F0E",
          gridColor: "rgba(212, 175, 55, 0.02)",
          toolbar_bg: "#0F0F0E",
          hide_legend: true,
          save_image: false,
          overrides: {
            "paneProperties.background": "#0F0F0E",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "rgba(212, 175, 55, 0.015)",
            "paneProperties.horzGridProperties.color": "rgba(212, 175, 55, 0.015)",
            "scalesProperties.textColor": "rgba(232, 228, 212, 0.5)",
            "mainSeriesProperties.candleStyle.upColor": "#D4AF37",
            "mainSeriesProperties.candleStyle.downColor": "#1a1a17",
            "mainSeriesProperties.candleStyle.borderColor": "#D4AF37",
            "mainSeriesProperties.candleStyle.borderUpColor": "#D4AF37",
            "mainSeriesProperties.candleStyle.borderDownColor": "#332a0f",
            "mainSeriesProperties.candleStyle.wickUpColor": "#D4AF37",
            "mainSeriesProperties.candleStyle.wickDownColor": "#332a0f"
          }
        });
      }
    };

    const existingScript = document.getElementById('tradingview-widget-script');
    if (existingScript) {
      initTimer = window.setTimeout(initWidget, 250);
    } else {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(initTimer);
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
        delete container.dataset.ready;
      }
    };
  }, [activeChartTab, liveChartEnabled]);

  const copyReferral = () => {
    if (!profile?.referralCode) return;
    const refUrl = `${window.location.origin}/register?ref=${profile.referralCode}`;
    navigator.clipboard.writeText(refUrl);
    toast.success('Referral link copied!');
  };

  const getEntryLabel = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
            Welcome back, {profile?.displayName || 'Investor'}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Track your investments, profits, and withdrawals.
          </p>
        </div>

        {/* Live Gold Price Button Pill */}
        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2 rounded-2xl self-start sm:self-auto shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            XAU/USD
          </span>
          <span className="font-mono text-xs font-extrabold text-brand-gold-dark dark:text-brand-gold">
            {goldPrice?.price ? `$${goldPrice.price.toFixed(2)}` : 'Loading...'}
          </span>
        </div>
      </div>

      {/* Marquee Live Activity Ticker */}
      <TrustBanner />

      {/* BALANCE HERO CARD */}
      <Card className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-50%] right-[-20%] w-[60%] h-[120%] bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[45%] h-[90%] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Your Balance
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold font-mono text-white mt-1.5 tracking-tight">
                $<CountUp value={totalPortfolioValue} />
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:gap-12 pt-2">
              <div>
                <span className="text-[10px] uppercase text-neutral-400 tracking-wider font-semibold block">
                   Today's Earnings
                </span>
                <p className="text-lg font-extrabold font-mono text-emerald-500 mt-1 flex items-center gap-1">
                  +$<CountUp value={totals.todayProfit} />
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-neutral-400 tracking-wider font-semibold block">
                   Total Profit Earned
                </span>
                <p className="text-lg font-extrabold font-mono text-brand-gold mt-1">
                  $<CountUp value={totals.totalEarned} />
                </p>
              </div>
            </div>
          </div>

          {/* Withdrawable Balance Column with CTAs */}
          <div className="border-t md:border-t-0 md:border-l border-neutral-800/80 pt-6 md:pt-0 md:pl-10 flex flex-col gap-4 min-w-[260px]">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Available Balance
                </span>
                {totals.withdrawableProfit >= MIN_PROFIT_WITHDRAWAL && (
                  <Badge variant="success" text="Ready" className="text-[9px] py-0 px-1.5" />
                )}
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-1.5">
                $<CountUp value={totals.withdrawableProfit} />
              </p>
            </div>

            <div className="flex gap-3">
              <Link to="/dashboard/invest" className="flex-1">
                <Button className="w-full bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-gold/15 transition-transform duration-200 active:scale-95">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Invest</span>
                </Button>
              </Link>
              <Link to="/dashboard/withdraw" className="flex-1">
                <Button variant="ghost" className="w-full border border-neutral-700 hover:bg-neutral-800 text-white font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-transform duration-200 active:scale-95">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Withdraw</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* QUICKSTATS 4-CARD GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Plans */}
        <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">Active Plans</span>
            <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50">
              {investments.filter((i) => i.status === 'active').length}
            </span>
          </div>
        </Card>

        {/* Total Referrals */}
        <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-500 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">Referrals</span>
            <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50">
              {referredUsers.length}
            </span>
          </div>
        </Card>

        {/* Total Withdrawals */}
        <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 flex-shrink-0">
            <HandCoins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">Total Withdrawn</span>
            <span className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-50">
              ${totalWithdrawalsPaid.toFixed(2)}
            </span>
          </div>
        </Card>

        {/* Account Level */}
        <Card className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 text-brand-gold flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">Status</span>
            <Badge variant="gold" text={activeTier} className="mt-0.5 text-[9px] py-0 px-2" />
          </div>
        </Card>
      </div>

      {/* MIDDLE SECTION: CHART & SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recharts Chart & Active Investments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Charts container */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              {/* Tab Selector */}
              <div className="flex gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/40 rounded-xl">
                <button 
                  onClick={() => {
                    setActiveChartTab('profit-history');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeChartTab === 'profit-history' 
                      ? "bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-sm" 
                      : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  }`}
                >
                  💰 Profit
                </button>
                <button 
                  onClick={() => {
                    setActiveChartTab('live-chart');
                    setLiveChartEnabled(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeChartTab === 'live-chart' 
                      ? "bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-sm" 
                      : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  }`}
                >
                  📊 Market
                </button>
              </div>

              {/* Date Filters */}
              {activeChartTab === 'profit-history' && (
                <div className="flex bg-neutral-100 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/40 p-1 rounded-xl">
                  {['7D', '30D', '90D', 'ALL'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setChartPeriod(p)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                        chartPeriod === p 
                          ? "bg-white dark:bg-neutral-900 text-brand-gold-dark dark:text-brand-gold shadow-sm" 
                          : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TradingView Widget (OANDA:XAUUSD) */}
            <div 
              className={`h-[300px] w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800/60 bg-neutral-50 dark:bg-neutral-950 relative ${
                activeChartTab !== 'live-chart' && "hidden"
              }`}
            >
              <div id="tradingview_gold_chart" className="w-full h-full" />
            </div>

            {/* Yield History Cumulative Area Chart */}
            <div 
              className={`h-[300px] w-full ${
                activeChartTab !== 'profit-history' && "hidden"
              }`}
            >
              {filteredChartData.length === 0 ? (
                <div className="h-full rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 flex flex-col items-center justify-center text-center p-6">
                  <Clock className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2 animate-pulse" />
                  <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                    {loading 
                      ? 'Loading your data...' 
                      : 'Your profit chart will appear here once your investment starts earning.'}
                  </p>
                </div>
              ) : (
                <div className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredChartData}
                      margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="profitGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.03)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(128, 128, 128, 0.4)" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="rgba(128, 128, 128, 0.4)" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const point = payload[0];
                            const value = Number(point?.value || 0);
                            return (
                              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-xl">
                                <p className="text-[9px] uppercase text-neutral-500 font-bold tracking-wider mb-1">{point?.payload?.date}</p>
                                <p className="font-mono text-sm font-extrabold text-brand-gold">${value.toFixed(2)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#D4AF37" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#profitGlow)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </Card>

          {/* ACTIVE INVESTMENTS TRACKERS */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-50">
                Current Investments
              </h3>
              <Link to="/dashboard/invest" className="text-xs text-brand-gold-dark dark:text-brand-gold hover:underline font-bold flex items-center gap-1">
                <span>Manage</span>
                <MoveRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {investments.length === 0 ? (
                <div className="col-span-full border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <Coins className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2 animate-bounce" />
                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No Investments</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
                    Make your first deposit to start earning daily profit.
                  </p>
                </div>
              ) : (
                investments.map((investment) => {
                  const tier = getTierForAmount(investment.amount);
                  const statusFormatted = investment.status.toUpperCase().replace(/_/g, ' ');
                  return (
                    <div 
                      key={investment.id} 
                      className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3 shadow-inner"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{tier.name} Plan</h4>
                          <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">ID: {investment.id.substring(0, 8)}...</span>
                        </div>
                        <Badge 
                          variant={investment.status === 'active' ? 'success' : 'gold'} 
                          text={statusFormatted} 
                          className="text-[9px] py-0 px-2 font-bold" 
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-neutral-200/20 dark:border-neutral-800/20">
                        <div>
                          <span className="text-[9px] uppercase text-neutral-400 tracking-wider block font-medium">Principal</span>
                          <span className="text-xs font-bold font-mono text-neutral-800 dark:text-neutral-200">${Number(investment.amount || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-neutral-400 tracking-wider block font-medium">Rate</span>
                          <span className="text-xs font-bold font-mono text-brand-gold">{(investment.dailyRateMin * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-neutral-400 tracking-wider block font-medium">Earned</span>
                          <span className="text-xs font-bold font-mono text-emerald-500">${Number(investment.profitAvailable || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-0.5">
                        <div className="flex justify-between text-[9px] text-neutral-400 font-medium">
                          <span>Status</span>
                          <span className="text-emerald-500 animate-pulse flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </div>
                        <ProgressBar value={100} className="h-1 bg-emerald-500/10" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: AI Insights & Referral Banner & Recent Transactions */}
        <div className="space-y-6">
          
          {/* AI Advisor Panel */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Bot className="w-24 h-24 text-brand-gold" />
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 overflow-hidden">
                <img src="/images/AI Agent Avatar.png" alt="AI Advisor" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm font-bold font-display text-neutral-900 dark:text-neutral-50">
                GoldEx Assistant
              </h3>
            </div>
            
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
              {hasLiveData 
                ? 'Your investments are active and earning daily. Ask the AI assistant about your portfolio or for profit projections.' 
                : 'Welcome to GoldEx! Make a deposit to start earning. Your AI assistant can answer any questions about the platform.'}
            </p>
            
            <Link to="/dashboard/ai-agent">
              <Button variant="ghost" className="w-full text-xs font-bold py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-950/60 rounded-xl flex items-center justify-center gap-1.5">
                <span>Ask AI Assistant</span>
                <MoveRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </Card>

          {/* Referral Link Copy Banner */}
          <Card className="bg-gradient-to-br from-brand-gold/10 via-transparent to-brand-gold/5 border border-brand-gold/25 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <Users className="w-16 h-16 text-brand-gold" />
            </div>
            <div className="relative space-y-3">
              <div>
                <Badge variant="gold" text="10% Referral Reward" className="text-[9px] py-0 px-2 font-bold" />
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1">Invite Friends</h3>
                <p className="text-[11px] text-neutral-400 leading-relaxed mt-0.5">
                  Get a 10% daily yield commission bonus on all profits generated by your referrals.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={profile?.referralCode ? `${window.location.origin}/register?ref=${profile.referralCode}` : 'Loading...'}
                  className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800/80 rounded-xl px-3 py-1.5 text-[10px] font-mono select-all text-neutral-600 dark:text-neutral-400 focus:outline-none"
                />
                <button 
                  onClick={copyReferral}
                  className="bg-brand-gold hover:bg-brand-gold-light text-neutral-950 font-bold p-2 text-xs rounded-xl flex items-center justify-center transition-colors shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>

          {/* RECENT ACTIVITY TABLE */}
          <Card className="p-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-neutral-200/50 dark:border-neutral-800/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Recent Activity
              </h3>
            </div>
            
            <div className="divide-y divide-neutral-200/40 dark:divide-neutral-800/40 max-h-[280px] overflow-y-auto scrollbar-none">
              {ledgerEntries.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400 flex flex-col items-center justify-center min-h-[160px]">
                  <Clock className="w-6 h-6 text-neutral-300 dark:text-neutral-800 mb-1" />
                  <span>No recent entries</span>
                </div>
              ) : (
                ledgerEntries.slice(0, 5).map((entry) => {
                  const amount = entry.amount;
                  const isProfit = entry.type === 'profit_added';
                  const isWithdrawal = entry.type === 'withdrawal_requested' || entry.type === 'withdrawal_paid';
                  const isDeposit = entry.type === 'deposit_created' || entry.type === 'deposit_approved';
                  
                  let amountColor = 'text-neutral-800 dark:text-neutral-200';
                  if (isProfit || entry.type === 'referee_bonus' || entry.type === 'referral_commission') amountColor = 'text-emerald-500 font-bold';
                  else if (isWithdrawal) amountColor = 'text-rose-500 font-bold';
                  
                  return (
                    <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-950/20 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                          {getEntryLabel(entry.type)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          {entry.createdAt?.toDate 
                            ? entry.createdAt.toDate().toLocaleDateString()
                            : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        {amount !== undefined && (
                          <span className={`text-xs font-mono ${amountColor}`}>
                            {isProfit || entry.type === 'referee_bonus' || entry.type === 'referral_commission' ? '+' : isWithdrawal ? '-' : ''}
                            ${amount.toFixed(2)}
                          </span>
                        )}
                        {entry.status && (
                          <Badge 
                            variant={
                              entry.status === 'verified' || entry.status === 'paid' || entry.status === 'completed' || entry.status === 'approved'
                                ? 'success'
                                : entry.status === 'pending'
                                ? 'warning'
                                : 'error'
                            } 
                            text={entry.status.toUpperCase()} 
                            className="text-[8px] py-0 px-1 font-bold"
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
