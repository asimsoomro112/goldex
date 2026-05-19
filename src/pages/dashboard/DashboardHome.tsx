import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Wallet, TrendingUp, HandCoins, Bot, MoveRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { MIN_PROFIT_WITHDRAWAL, useDashboardData } from '@/lib/dashboardData';

export function DashboardHome() {
  const [chartPeriod, setChartPeriod] = useState('7D');
  const [goldPrice, setGoldPrice] = useState<{ price: number | null; source: string; updatedAt: string } | null>(null);
  const { user } = useAuth();
  const { investments, totals, loading } = useDashboardData(user?.uid);
  const hasLiveData = investments.length > 0;

  useEffect(() => {
    const fetchPrice = () => {
      fetch('/api/gold-price?t=' + Date.now())
        .then((response) => response.json())
        .then((data) => setGoldPrice(data))
        .catch(() => setGoldPrice(null));
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Mobile-only Live Price XAUUSD Card */}
      <div className="xl:hidden w-full">
         <div className="gc p-[24px] bg-dark-800/80 border-gold-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gold-500" />
                <h3 className="font-sans font-medium text-[15px] text-white">Live Price XAUUSD</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
            </div>
            <p className="font-mono text-2xl text-gold-500 mb-0">{goldPrice?.price ? `$${goldPrice.price.toFixed(2)}` : 'Loading price...'}</p>
         </div>
      </div>

      {/* 4-Card Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[12px]">
         {[
           { lbl: 'Locked Principal', val: `$${totals.lockedPrincipal.toFixed(2)}`, img: '/images/Invest $50.png', color: 'gold', badge: null },
           { lbl: "Today's Profit", val: `$${totals.todayProfit.toFixed(2)}`, img: '/images/Daily Profits.png', color: 'green', badge: null },
           { lbl: 'Total Earned', val: `$${totals.totalEarned.toFixed(2)}`, img: '/images/Gold Bar Trading.png', color: 'gold', badge: null },
           { lbl: 'Withdrawable Profit', val: `$${totals.withdrawableProfit.toFixed(2)}`, img: '/images/Auth Floating Stat Cards Visual.png', color: 'green', badge: totals.withdrawableProfit >= MIN_PROFIT_WITHDRAWAL ? 'Ready' : null, action: 'withdraw' },
         ].map((stat, i) => (
           <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={cn(
               "gc flex flex-col justify-between p-[24px_20px] min-h-[120px] relative shrink-0",
               stat.color === 'green' ? "bg-dark-900 border-profit-green/10" : "bg-dark-900"
             )}
           >
             {/* Gradient overlay */}
             <div className="absolute inset-0 pointer-events-none rounded-inherit mix-blend-screen"
               style={{ background: `radial-gradient(circle at top right, ${stat.color === 'green' ? 'rgba(0,245,160,0.06)' : 'rgba(212,175,55,0.06)'} 0%, transparent 60%)` }} 
             />
             
             <div className="flex items-start justify-between mb-4 relative z-10 w-full">
               <img src={stat.img} alt="" className="w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(212,175,55,0.2)]" />
               
               {stat.badge && (
                 <span className={cn(
                   "badge",
                   stat.badge.startsWith('+') ? "badge-green" : "badge-red"
                 )}>
                   {stat.badge}
                 </span>
               )}
             </div>
             
             <div className="flex flex-col relative z-10">
                <span className="font-sans text-[12px] uppercase text-[#E8E4D4]/45 tracking-[0.06em] mb-[4px]">{stat.lbl}</span>
                <div className="flex items-end justify-between">
                   <motion.span 
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                     className={cn("t-num-lg leading-none", stat.color === 'green' ? "text-profit-green" : "text-white")}
                   >
                     {stat.val}
                   </motion.span>
                   {stat.action === 'withdraw' && (
                     <Link to="/dashboard/withdraw">
                       <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: '11px', height: 'auto', minHeight: '24px', borderRadius: '6px' }}>
                         Withdraw
                       </button>
                     </Link>
                   )}
                </div>
             </div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Content Area: Chart and Table */}
         <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Profit Chart */}
            <div className="gc p-[24px]">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-[24px]">
                 <h3 className="font-display font-medium text-[18px] text-white">Profit History</h3>
                 <div className="flex gc bg-dark-900 border-gold-500/20 p-1 rounded-lg">
                   {['7D', '30D', '90D', 'ALL'].map(p => (
                     <button 
                       key={p} 
                       onClick={() => setChartPeriod(p)}
                       className={cn(
                         "px-[12px] py-[6px] text-[12px] font-sans font-medium rounded-[6px] transition-all cursor-none",
                         chartPeriod === p ? "bg-gold-500 text-dark-900 shadow-[0_2px_8px_rgba(212,175,55,0.4)]" : "text-[#E8E4D4]/40 hover:text-white bg-transparent"
                       )}
                     >
                       {p}
                     </button>
                   ))}
                 </div>
               </div>
               
               <div className="h-[220px] w-full">
                 <div className="h-full rounded-xl border border-gold-500/10 bg-dark-900/40 flex flex-col items-center justify-center text-center px-6 overflow-hidden relative">
                   {!hasLiveData && (
                      <div className="flex flex-col items-center justify-center gap-2 mb-4 relative z-10">
                        <img src="/images/Empty Transactions.png" alt="" className="w-24 h-24 object-contain opacity-75 drop-shadow-[0_0_15px_rgba(212,175,55,0.25)]" />
                      </div>
                    )}
                   <p className="text-sm text-text-muted relative z-10">{loading ? 'Loading live data...' : 'Profit starts after a verified $50-multiple investment. Withdrawal unlocks when profit reaches $50.'}</p>
                 </div>
               </div>
            </div>

            {/* Active Investments */}
            <div className="gc p-0 border-[#D4AF37]/12">
               <div className="p-6 border-b border-gold-500/10 flex justify-between items-center">
                 <h3 className="text-lg font-display font-medium text-white">Active Investments</h3>
                 <Link to="/dashboard/invest" className="text-gold-500 text-sm font-sans font-medium hover:underline flex items-center gap-1">Manage <MoveRight className="w-4 h-4" /></Link>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-[11px] uppercase tracking-wider text-text-muted bg-dark-900/50 font-sans">
                     <tr>
                       <th className="px-6 py-4 font-medium">Plan</th>
                       <th className="px-6 py-4 font-medium">Locked</th>
                       <th className="px-6 py-4 font-medium">Rate</th>
                       <th className="px-6 py-4 font-medium">Daily Profit</th>
                       <th className="px-6 py-4 font-medium">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {investments.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-text-muted relative overflow-hidden">
                            <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                              <img src="/images/Empty Investments.png" alt="No Investments" className="w-28 h-28 object-contain opacity-75 mb-2 drop-shadow-[0_0_20px_rgba(212,175,55,0.25)]" />
                              <p className="text-sm max-w-md">No active live investments. Profit stops after the related profit withdrawal is completed.</p>
                            </div>
                          </td>
                       </tr>
                     ) : investments.map((investment) => (
                       <tr key={investment.id} className="border-b border-gold-500/5 hover:bg-[#11111F]/50 transition-colors">
                         <td className="px-6 py-4 font-medium font-sans text-white">{investment.amount >= 5000 ? 'Elite' : investment.amount >= 500 ? 'Growth' : 'Starter'}</td>
                         <td className="px-6 py-4 font-mono text-gold-500">${Number(investment.amount || 0).toFixed(2)}</td>
                         <td className="px-6 py-4 font-mono text-[#E8E4D4]/60">0.5% - 1%</td>
                         <td className="px-6 py-4 font-mono text-profit-green">${Number(investment.profitAvailable || 0).toFixed(2)}</td>
                         <td className="px-6 py-4"><span className="badge badge-gold">{investment.status.replace(/_/g, ' ')}</span></td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>

         </div>

         {/* Sidebar Content Area */}
         <div className="flex flex-col gap-6">
            
             {/* Live Gold Widget */}
             <div className="hidden xl:block gc p-[24px] bg-dark-800/80 border-gold-500/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gold-500" />
                    <h3 className="font-sans font-medium text-[15px] text-white">Live Price XAUUSD</h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                </div>
                <p className="font-mono text-2xl text-gold-500 mb-0">{goldPrice?.price ? `$${goldPrice.price.toFixed(2)}` : 'Loading price...'}</p>
             </div>

            {/* AI Insight Widget */}
            <div className="gc p-[24px] bg-dark-800/80 border-gold-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-[0.18] pointer-events-none">
                 <img src="/images/AI Agent Avatar.png" alt="" className="w-36 h-36 -mt-6 -mr-6 object-cover opacity-60 mix-blend-screen" />
               </div>
               <div className="flex items-center gap-2 mb-4 relative z-10">
                 <div className="w-8 h-8 rounded-[8px] bg-gold-500/10 flex items-center justify-center border border-gold-500/20 overflow-hidden">
                   <img src="/images/AI Agent Avatar.png" alt="AI Avatar" className="w-full h-full object-cover" />
                 </div>
                 <h3 className="font-sans font-medium text-[15px] text-white">GoldEx AI Insight</h3>
               </div>
               <p className="font-sans text-[14px] text-text-secondary leading-[1.8] mb-6 relative z-10">
                 {hasLiveData ? 'Live portfolio data is connected. Ask the AI agent about your active investments.' : 'No live market or portfolio data is connected yet.'}
               </p>
               <Link to="/dashboard/ai-agent" className="relative z-10">
                 <button className="btn-ghost w-full">Ask Claude 3.5 AI</button>
               </Link>
            </div>

            {/* Recent Activity */}
            <div className="gc flex-1 p-0 flex flex-col border-[#D4AF37]/12">
               <div className="p-6 border-b border-gold-500/10">
                 <h3 className="text-lg font-display font-medium text-white">Recent Activity</h3>
               </div>
               <div className="p-6 flex flex-col gap-6">
                  <div className="p-4 flex flex-col items-center justify-center gap-3 min-h-[160px]">
                     <img src="/images/Empty Transactions.png" alt="" className="w-20 h-20 object-contain opacity-60 drop-shadow-[0_0_15px_rgba(212,175,55,0.15)]" />
                     <p className="text-xs text-text-muted text-center max-w-[200px]">No live activity yet.</p>
                   </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
