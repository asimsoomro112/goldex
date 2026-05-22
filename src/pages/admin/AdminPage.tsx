import React, { useState, useMemo } from 'react';
import { CheckCircle2, CircleDollarSign, Home, LogOut, RefreshCw, ShieldCheck, Users, Wallet, XCircle, MessageSquare, HelpCircle, Send, Coins, Search, Download, TrendingUp, Activity, Zap, ArrowUpRight, Clock, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  addInvestmentProfit,
  approveDeposit,
  createApprovalRequest,
  markWithdrawalPaid,
  rejectDeposit,
  rejectWithdrawal,
  reviewApprovalRequest,
  updateKycStatus,
  updateWalletStatus,
  useAdminData,
  distributeGlobalProfit,
} from '@/lib/adminData';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import type { SupportTicket } from '@/lib/dashboardData';
import { getTierForAmount } from '@/lib/dashboardData';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

// ─── CSV Export Utility ──────────────────────────────────────────────
function downloadCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return toast.error('No data to export.');
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = val?.toDate ? val.toDate().toISOString() : String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} records.`);
}

// ─── Animation Variants ──────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

export function AdminPage() {
  const { user: adminUser, logout } = useAuth();
  const { users, deposits, investments, withdrawals, wallets = [], auditLogs, tickets = [], approvalRequests = [], loading } = useAdminData();
  const [profitInputs, setProfitInputs] = useState<Record<string, string>>({});
  const [payoutTxInputs, setPayoutTxInputs] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'overview' | 'deposits' | 'investments' | 'withdrawals' | 'users' | 'kyc' | 'wallets' | 'approvals' | 'audit' | 'support'>('overview');

  const [globalRate, setGlobalRate] = useState('');
  const [distributingYield, setDistributingYield] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminReplyMsg, setAdminReplyMsg] = useState('');
  const [sendEmailChecked, setSendEmailChecked] = useState(true);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReplyMsg.trim()) return;

    setReplySubmitting(true);
    try {
      const { addTicketReply } = await import('@/lib/dashboardData');
      await addTicketReply(selectedTicket.id, 'admin', adminReplyMsg.trim());
      
      if (sendEmailChecked) {
        await sendEmail('support_reply', {
          to: selectedTicket.email,
          name: selectedTicket.name,
          data: { message: adminReplyMsg.trim() },
        });
      }

      toast.success('Reply submitted successfully!');
      const newReply = { sender: 'admin', message: adminReplyMsg.trim(), createdAt: new Date() };
      setSelectedTicket({
        ...selectedTicket,
        replies: [...(selectedTicket.replies || []), newReply],
        status: 'resolved'
      });
      setAdminReplyMsg('');
    } catch (error: any) {
      toast.error(error.message || 'Could not send reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const pendingDeposits = deposits.filter((deposit) => deposit.status === 'pending');
  const activeInvestments = investments.filter((investment) => investment.status === 'active');
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === 'pending');
  const pendingKyc = users.filter((account) => account.kycStatus === 'pending');
  const pendingWallets = wallets.filter((wallet) => wallet.status === 'pending');
  const pendingApprovals = approvalRequests.filter((request) => request.status === 'pending');
  const lockedTotal = users.reduce((sum, user) => sum + Number(user.totals?.lockedPrincipal || 0), 0);
  const totalEarned = users.reduce((sum, user) => sum + Number(user.totals?.totalEarned || 0), 0);
  const totalPendingActions = pendingDeposits.length + pendingWithdrawals.length + pendingKyc.length + pendingWallets.length + pendingApprovals.length;
  const findUser = (uid: string) => users.find((user) => user.uid === uid);

  // ─── Search Filter Logic ──────────────────────────────────────────
  const sq = searchQuery.toLowerCase().trim();
  const filterRecord = (record: any) => {
    if (!sq) return true;
    const user = findUser(record.uid);
    return (
      user?.displayName?.toLowerCase().includes(sq) ||
      user?.email?.toLowerCase().includes(sq) ||
      record.txHash?.toLowerCase().includes(sq) ||
      record.walletAddress?.toLowerCase().includes(sq) ||
      String(record.amount || '').includes(sq) ||
      record.uid?.toLowerCase().includes(sq)
    );
  };
  const filterUser = (user: any) => {
    if (!sq) return true;
    return (
      user.displayName?.toLowerCase().includes(sq) ||
      user.email?.toLowerCase().includes(sq) ||
      user.uid?.toLowerCase().includes(sq) ||
      user.referralCode?.toLowerCase().includes(sq)
    );
  };

  // ─── Analytics Data (computed from existing records) ──────────────
  const depositChartData = useMemo(() => {
    const map = new Map<string, number>();
    deposits.forEach(d => {
      const date = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
      if (date) map.set(date, (map.get(date) || 0) + Number(d.amount || 0));
    });
    return Array.from(map.entries()).slice(-14).map(([date, volume]) => ({ date, volume }));
  }, [deposits]);

  const tierDistribution = useMemo(() => {
    const counts = { Starter: 0, Growth: 0, Elite: 0 };
    investments.filter(i => i.status === 'active').forEach(inv => {
      const tier = getTierForAmount(Number(inv.amount || 0)).name;
      if (tier in counts) counts[tier as keyof typeof counts]++;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [investments]);

  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: Home, count: null },
    { id: 'deposits' as const, label: 'Deposits', icon: Wallet, count: pendingDeposits.length },
    { id: 'investments' as const, label: 'Investments', icon: ShieldCheck, count: activeInvestments.length },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: CircleDollarSign, count: pendingWithdrawals.length },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'kyc' as const, label: 'KYC', icon: ShieldCheck, count: pendingKyc.length },
    { id: 'wallets' as const, label: 'Wallets', icon: Wallet, count: pendingWallets.length },
    { id: 'approvals' as const, label: 'Approvals', icon: ShieldCheck, count: pendingApprovals.length },
    { id: 'support' as const, label: 'Support', icon: HelpCircle, count: tickets.filter((t) => t.status === 'open').length },
    { id: 'audit' as const, label: 'Audit Log', icon: Activity, count: auditLogs.length },
  ];

  const runAction = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      toast.success(success);
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-dark-900 text-text-primary flex">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col bg-dark-950 border-r border-gold-500/10 sticky top-0 h-screen">
        <div className="h-20 px-6 flex items-center border-b border-gold-500/10 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/30 to-gold-500/5 border border-gold-500/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-gold-500" />
          </div>
          <div>
            <h1 className="font-display text-xl text-white">GoldEx Admin</h1>
            <p className="text-[10px] text-text-muted font-mono">Control Center v2.0</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeSection === item.id ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20 shadow-[0_0_20px_rgba(212,175,55,0.06)]' : 'text-text-secondary hover:text-white hover:bg-dark-800'}`}
            >
              <span className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-sans text-sm font-medium">{item.label}</span>
              </span>
              {item.count !== null && (
                <span className={`font-mono text-xs rounded-full px-2 py-0.5 ${
                  item.count > 0 && ['deposits', 'withdrawals', 'kyc', 'wallets', 'approvals'].includes(item.id)
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    : 'bg-dark-900 border border-gold-500/10 text-text-muted'
                }`}>{item.count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gold-500/10 space-y-2">
          <button onClick={() => window.location.reload()} className="btn-ghost w-full justify-center h-10 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={logout} className="btn-ghost w-full justify-center h-10 text-sm text-danger">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-gold-500/10">
          <div className="px-4 sm:px-6 lg:px-8 h-auto lg:h-20 py-4 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-display text-2xl text-white">Admin Dashboard</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                  <p className="text-[10px] text-emerald-400 font-mono">System Operational</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Global Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users, emails, hashes..."
                  className="bg-dark-900 border border-gold-500/15 focus:border-gold-500/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none transition-colors w-[280px]"
                />
              </div>
              {/* Mobile nav */}
              <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 lg:hidden">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border ${activeSection === item.id ? 'bg-gold-500/10 border-gold-500/30 text-gold-500' : 'border-gold-500/10 text-text-secondary'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button onClick={() => window.location.reload()} className="btn-ghost h-10 px-4 text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={logout} className="btn-ghost h-10 px-4 text-sm text-danger">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {loading && <div className="gc p-6 text-text-muted">Loading admin data...</div>}

          {/* ═══════════════════════════════════════════════════════════
              BENTO GRID OVERVIEW
          ═══════════════════════════════════════════════════════════ */}
          {activeSection === 'overview' && !loading && (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
              {/* ── Hero KPI Row ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: users.length, icon: Users, color: '#60A5FA', delta: `+${users.filter(u => { const d = u.createdAt?.toDate?.(); return d && Date.now() - d.getTime() < 7 * 86400000; }).length} this week` },
                  { label: 'Locked Principal', value: `$${lockedTotal.toFixed(2)}`, icon: CircleDollarSign, color: '#F5C518', delta: `${activeInvestments.length} active` },
                  { label: 'Pending Actions', value: totalPendingActions, icon: Clock, color: totalPendingActions > 0 ? '#F59E0B' : '#4ADE80', delta: totalPendingActions > 0 ? 'Requires attention' : 'All clear' },
                  { label: 'Profit Distributed', value: `$${totalEarned.toFixed(2)}`, icon: TrendingUp, color: '#4ADE80', delta: `${auditLogs.filter(l => l.action === 'profit_added' || l.action === 'global_yield').length} distributions` },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    variants={fadeUp}
                    className="relative overflow-hidden rounded-2xl border border-gold-500/10 bg-dark-950/80 backdrop-blur-sm p-5 hover:border-gold-500/20 transition-all duration-300 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[rgba(212,175,55,0.03)] group-hover:to-[rgba(212,175,55,0.06)] transition-all duration-500" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                          <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                        </div>
                        {stat.label === 'Pending Actions' && totalPendingActions > 0 && (
                          <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]" />
                        )}
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold">{stat.label}</p>
                      <p className="text-2xl font-mono text-white mt-1 font-bold">{stat.value}</p>
                      <p className="text-[10px] mt-2 font-mono" style={{ color: stat.color }}>{stat.delta}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* ── Quick Actions + Yield Distribution ── */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-gold-500/10 bg-dark-950/80 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-gold-500" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Actions</h3>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-xs text-text-secondary block">Global Yield Rate (%)</label>
                    <div className="relative">
                      <input
                        type="number" step="0.01" min="0.1" max="5.0"
                        value={globalRate} onChange={(e) => setGlobalRate(e.target.value)}
                        placeholder="0.75"
                        className="input-gold font-mono text-sm py-3 pl-4 pr-12 w-full"
                      />
                      <span className="absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-text-secondary">%</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={distributingYield || !globalRate}
                    onClick={async () => {
                      const rate = Number(globalRate);
                      if (!rate || rate <= 0) return toast.error('Enter a valid percentage rate.');
                      if (!window.confirm(`Are you sure you want to distribute ${rate}% yield to all active portfolios?`)) return;
                      setDistributingYield(true);
                      try {
                        await distributeGlobalProfit(rate, adminUser?.uid || 'unknown-admin');
                        toast.success(`Successfully distributed ${rate}% yield to all active portfolios!`);
                        setGlobalRate('');
                      } catch (err: any) {
                        toast.error(err.message || 'Yield distribution failed.');
                      } finally {
                        setDistributingYield(false);
                      }
                    }}
                    className="btn-gold h-12 px-6 text-sm font-semibold flex items-center gap-2 whitespace-nowrap min-w-[200px] justify-center w-full lg:w-auto"
                  >
                    <Coins className="w-4 h-4" />
                    {distributingYield ? 'Distributing...' : 'Distribute Global Yield'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => downloadCSV(users.map(u => ({ name: u.displayName, email: u.email, role: u.role, locked: u.totals?.lockedPrincipal, earned: u.totals?.totalEarned, kyc: u.kycStatus })), 'goldex_users')} className="btn-ghost h-12 px-4 text-xs gap-1.5">
                      <FileDown className="w-4 h-4" /> Users CSV
                    </button>
                    <button onClick={() => downloadCSV(deposits.map(d => ({ user: findUser(d.uid)?.email || d.uid, amount: d.amount, txHash: d.txHash, status: d.status, tier: getTierForAmount(Number(d.amount || 0)).name, date: d.createdAt })), 'goldex_deposits')} className="btn-ghost h-12 px-4 text-xs gap-1.5">
                      <FileDown className="w-4 h-4" /> Deposits CSV
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* ── Analytics + Activity Feed Row ── */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Deposit Volume Chart */}
                <motion.div variants={fadeUp} className="xl:col-span-5 rounded-2xl border border-gold-500/10 bg-dark-950/80 backdrop-blur-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gold-500" /> Deposit Volume
                    </h3>
                    <span className="text-[10px] text-text-muted font-mono">Last 14 entries</span>
                  </div>
                  <div className="h-[180px]">
                    {depositChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={depositChartData}>
                          <defs>
                            <linearGradient id="adminGold" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.06)" />
                          <XAxis dataKey="date" tick={{ fill: 'rgba(184,176,160,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'rgba(184,176,160,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                          <Tooltip contentStyle={{ background: '#0A0A14', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#D4AF37' }} />
                          <Area type="monotone" dataKey="volume" stroke="#D4AF37" fill="url(#adminGold)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center text-text-muted text-xs">No deposit data yet</div>}
                  </div>
                </motion.div>

                {/* Tier Distribution Chart */}
                <motion.div variants={fadeUp} className="xl:col-span-3 rounded-2xl border border-gold-500/10 bg-dark-950/80 backdrop-blur-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gold-500" /> Tier Split
                    </h3>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tierDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.06)" />
                        <XAxis dataKey="name" tick={{ fill: 'rgba(184,176,160,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'rgba(184,176,160,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0A0A14', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 12, fontSize: 12 }} />
                        <Bar dataKey="count" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Real-Time Activity Feed */}
                <motion.div variants={fadeUp} className="xl:col-span-4 rounded-2xl border border-gold-500/10 bg-dark-950/80 backdrop-blur-sm overflow-hidden flex flex-col max-h-[320px]">
                  <div className="p-4 border-b border-gold-500/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-semibold text-white">Live Activity</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-gold-500/5">
                    {auditLogs.slice(0, 12).map((log) => {
                      const actionColors: Record<string, string> = {
                        deposit_approved: '#4ADE80', deposit_rejected: '#EF4444', withdrawal_paid: '#60A5FA',
                        settlement_paid: '#F472B6', profit_added: '#F5C518', global_yield: '#D4AF37',
                        kyc_verified: '#4ADE80', kyc_rejected: '#EF4444',
                      };
                      const color = actionColors[log.action] || '#A1A1AA';
                      return (
                        <div key={log.id} className="px-4 py-3 flex items-start gap-3 hover:bg-dark-800/30 transition-colors">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}50` }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white truncate">
                              <span className="font-medium">{findUser(log.actorUid)?.displayName || 'Admin'}</span>
                              <span className="text-text-muted"> · </span>
                              <span className="font-mono" style={{ color }}>{log.action.replace(/_/g, ' ')}</span>
                            </p>
                            <p className="text-[10px] text-text-muted font-mono mt-0.5 truncate">
                              {typeof log.amount === 'number' ? `$${log.amount.toFixed(2)} · ` : ''}{findUser(log.targetUid)?.displayName || log.targetUid?.slice(0, 8)}
                            </p>
                          </div>
                          <span className="text-[9px] text-text-muted font-mono shrink-0 mt-0.5">
                            {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      );
                    })}
                    {auditLogs.length === 0 && <div className="p-6 text-center text-text-muted text-xs">No activity yet</div>}
                  </div>
                </motion.div>
              </div>

              {/* ── Pending Queue Tiles ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'Pending Deposits', count: pendingDeposits.length, section: 'deposits' as const, icon: Wallet, color: '#F5C518' },
                  { label: 'Pending Withdrawals', count: pendingWithdrawals.length, section: 'withdrawals' as const, icon: CircleDollarSign, color: '#60A5FA' },
                  { label: 'Pending KYC', count: pendingKyc.length, section: 'kyc' as const, icon: ShieldCheck, color: '#4ADE80' },
                ].map((q) => (
                  <motion.button
                    key={q.label}
                    variants={fadeUp}
                    onClick={() => setActiveSection(q.section)}
                    className="relative overflow-hidden rounded-2xl border border-gold-500/10 bg-dark-950/80 backdrop-blur-sm p-5 text-left hover:border-gold-500/25 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-text-muted font-semibold">{q.label}</p>
                        <p className="text-3xl font-mono text-white mt-1 font-bold">{q.count}</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${q.color}10`, border: `1px solid ${q.color}25` }}>
                        <q.icon className="w-6 h-6" style={{ color: q.color }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3 text-xs group-hover:text-gold-500 transition-colors" style={{ color: q.color }}>
                      <span>Review Now</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                    {q.count > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              DATA SECTIONS (preserved from original with search filtering)
          ═══════════════════════════════════════════════════════════ */}

          {/* ── Deposits ── */}
          {activeSection === 'deposits' && <Section title="Pending Deposits" onExport={() => downloadCSV(deposits.map(d => ({ user: findUser(d.uid)?.email || d.uid, amount: d.amount, txHash: d.txHash, status: d.status, tier: getTierForAmount(Number(d.amount || 0)).name, date: d.createdAt })), 'goldex_deposits')}>
          <Table headers={['User', 'Amount', 'TX Hash', 'Investment', 'Actions']}>
            {pendingDeposits.filter(filterRecord).length === 0 ? <EmptyRow colSpan={5} label="No pending deposits." /> : pendingDeposits.filter(filterRecord).map((deposit) => (
              <tr key={deposit.id} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(deposit.uid)?.displayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(deposit.uid)?.email || deposit.uid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-white">${Number(deposit.amount || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[220px] truncate">{deposit.txHash || '-'}</td>
                <td className="px-4 py-3 text-xs text-text-muted">
                  <div>
                    <p className="font-sans font-medium text-gold-500">{getTierForAmount(Number(deposit.amount || 0)).name}</p>
                    <p className="text-[10px] text-text-muted">{deposit.investmentId || '-'}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => runAction(async () => {
                      await approveDeposit(deposit, adminUser?.uid || 'unknown-admin');
                      const account = findUser(deposit.uid);
                      await sendEmail('deposit_verified', { to: account?.email, name: account?.displayName, data: { amount: deposit.amount } });
                      const amountNum = Number(deposit.amount || 0);
                      const depositPlanName = getTierForAmount(amountNum).name;
                      await sendEmail('investment_selected', { to: account?.email, name: account?.displayName, data: { amount: deposit.amount, plan: depositPlanName } });
                    }, 'Deposit approved')} className="btn-gold h-9 px-3 text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                     <button onClick={() => {
                       const reason = window.prompt("Enter deposit rejection reason (e.g. Invalid transaction hash, incorrect token, amount mismatch, etc.):");
                       if (reason === null) return;
                       runAction(async () => {
                         await rejectDeposit(deposit, adminUser?.uid || 'unknown-admin', reason);
                         const account = findUser(deposit.uid);
                         await sendEmail('deposit_rejected', { to: account?.email, name: account?.displayName, data: { amount: deposit.amount, rejectionReason: reason } });
                       }, 'Deposit rejected');
                     }} className="btn-ghost h-9 px-3 text-xs text-danger">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

          {/* ── Investments ── */}
          {activeSection === 'investments' && <>
            <Section title="Active Investments" onExport={() => downloadCSV(investments.map(inv => ({ user: findUser(inv.uid)?.email || inv.uid, amount: inv.amount, status: inv.status, profitAvailable: inv.profitAvailable, profitTotal: inv.profitTotal, tier: getTierForAmount(Number(inv.amount || 0)).name, date: inv.createdAt })), 'goldex_investments')}>
            <Table headers={['User', 'Amount', 'Profit Available', 'Total Profit', 'Add Profit']}>
              {activeInvestments.filter(filterRecord).length === 0 ? <EmptyRow colSpan={5} label="No active investments." /> : activeInvestments.filter(filterRecord).map((investment) => (
                <tr key={investment.id} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    <div>
                      <p className="font-sans font-medium text-white">{findUser(investment.uid)?.displayName || 'Unknown User'}</p>
                      <p className="text-[10px] text-text-muted">{findUser(investment.uid)?.email || investment.uid}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-white">${Number(investment.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-profit-green">${Number(investment.profitAvailable || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-white">${Number(investment.profitTotal || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <input
                        value={profitInputs[investment.id] || ''}
                        onChange={(event) => setProfitInputs((prev) => ({ ...prev, [investment.id]: event.target.value }))}
                        type="number" min="0" step="0.01"
                        className="input-gold h-9 py-1 max-w-[120px] font-mono" placeholder="0.00"
                      />
                      <button
                        onClick={() => {
                          const amount = Number(profitInputs[investment.id] || 0);
                          if (amount <= 0) return toast.error('Enter profit amount');
                          runAction(() => addInvestmentProfit(investment, amount, adminUser?.uid || 'unknown-admin'), 'Profit added successfully');
                          setProfitInputs((prev) => ({ ...prev, [investment.id]: '' }));
                        }}
                        className="btn-gold h-9 px-3 text-xs"
                      >Add</button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          </Section>
          </>}

          {/* ── Withdrawals ── */}
          {activeSection === 'withdrawals' && <Section title="Pending Withdrawals" onExport={() => downloadCSV(withdrawals.map(w => ({ user: findUser(w.uid)?.email || w.uid, type: w.type, speed: w.speed, amount: w.amount, fee: w.fee, wallet: w.walletAddress, status: w.status, date: w.createdAt })), 'goldex_withdrawals')}>
          <Table headers={['User', 'Type', 'Speed', 'Amount', 'Fee', 'Wallet', 'Status', 'Actions']}>
            {pendingWithdrawals.filter(filterRecord).length === 0 ? <EmptyRow colSpan={8} label="No pending withdrawals." /> : pendingWithdrawals.filter(filterRecord).map((withdrawal) => {
              const isSettlement = withdrawal.type === 'settlement';
              const speedTier = withdrawal.speed || 'standard';
              const feeAmount = Number(withdrawal.fee || 0);
              return (
                <tr key={withdrawal.id} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    <div>
                      <p className="font-sans font-medium text-white">{findUser(withdrawal.uid)?.displayName || 'Unknown User'}</p>
                      <p className="text-[10px] text-text-muted">{findUser(withdrawal.uid)?.email || withdrawal.uid}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isSettlement ? 'bg-danger/15 text-danger border border-danger/25' : 'bg-gold-500/15 text-gold-500 border border-gold-500/25'}`}>
                      {isSettlement ? 'Settlement' : 'Profit'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-white font-medium">{speedTier}</td>
                  <td className="px-4 py-3 font-mono text-white">${Number(withdrawal.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-danger">${feeAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[180px] truncate">{withdrawal.walletAddress}</td>
                  <td className="px-4 py-3"><span className="badge badge-gold">{withdrawal.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={payoutTxInputs[withdrawal.id] || ''}
                        onChange={(event) => setPayoutTxInputs((prev) => ({ ...prev, [withdrawal.id]: event.target.value }))}
                        className="input-gold h-9 py-1 max-w-[180px] font-mono text-xs" placeholder="Payout tx hash"
                      />
                      <button onClick={() => runAction(async () => {
                        await markWithdrawalPaid(withdrawal, adminUser?.uid || 'unknown-admin', payoutTxInputs[withdrawal.id]);
                        const account = findUser(withdrawal.uid);
                        await sendEmail('withdrawal_paid', { to: account?.email, name: account?.displayName, data: { amount: withdrawal.amount } });
                      }, 'Withdrawal marked paid')} className="btn-gold h-9 px-3 text-xs">Paid</button>
                      <button onClick={() => {
                        const reason = window.prompt("Enter withdrawal rejection reason:");
                        if (reason === null) return;
                        runAction(async () => {
                          await rejectWithdrawal(withdrawal, adminUser?.uid || 'unknown-admin', reason);
                          const account = findUser(withdrawal.uid);
                          await sendEmail('withdrawal_rejected', { to: account?.email, name: account?.displayName, data: { amount: withdrawal.amount, rejectionReason: reason } });
                        }, 'Withdrawal rejected');
                      }} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Section>}

          {/* ── Users ── */}
          {activeSection === 'users' && <Section title="Users" onExport={() => downloadCSV(users.map(u => ({ name: u.displayName, email: u.email, role: u.role, referralCode: u.referralCode, referredBy: u.referredBy, lockedPrincipal: u.totals?.lockedPrincipal, withdrawableProfit: u.totals?.withdrawableProfit, kyc: u.kycStatus })), 'goldex_users')}>
          <Table headers={['Name', 'Email', 'Role', 'Referral', 'Referred By', 'Locked', 'Withdrawable']}>
            {users.filter(filterUser).length === 0 ? <EmptyRow colSpan={7} label="No users found." /> : users.filter(filterUser).map((user) => (
              <tr key={user.uid} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                <td className="px-4 py-3 text-white">{user.displayName || 'Account'}</td>
                <td className="px-4 py-3 text-text-secondary">{user.email || '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{user.role || 'user'}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{user.referralCode || '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{user.referredBy || '-'}</td>
                <td className="px-4 py-3 font-mono text-white">${Number(user.totals?.lockedPrincipal || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-profit-green">${Number(user.totals?.withdrawableProfit || 0).toFixed(2)}</td>
              </tr>
            ))}
          </Table>
        </Section>}

          {/* ── KYC ── */}
          {activeSection === 'kyc' && <Section title="KYC Review Queue">
          <Table headers={['User', 'Extracted Details', 'Document', 'Status', 'Notes', 'Actions']}>
            {pendingKyc.length === 0 ? <EmptyRow colSpan={6} label="No pending KYC reviews." /> : pendingKyc.map((account: any) => (
              <tr key={account.uid} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                <td className="px-4 py-3 text-xs">
                  <div className="text-white font-medium">{account.displayName || 'Account'}</div>
                  <div className="text-text-muted text-[10px]">{account.email || '-'}</div>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary space-y-0.5">
                  <div><span className="text-text-muted">Name:</span> {account.kycLegalName || '-'}</div>
                  <div><span className="text-text-muted">Doc:</span> {account.kycDocumentType?.toUpperCase()} ({account.kycDocumentNumber || '-'})</div>
                  <div><span className="text-text-muted">Country:</span> {account.kycCountry || '-'}</div>
                </td>
                <td className="px-4 py-3 text-xs space-y-1">
                  {account.kycDocumentUrl ? (
                    <div className="flex flex-col gap-1">
                      <a href={account.kycDocumentUrl} target="_blank" rel="noreferrer" className="text-gold-500 hover:underline">Front Side ↗</a>
                      {account.kycBackDocumentUrl && <a href={account.kycBackDocumentUrl} target="_blank" rel="noreferrer" className="text-gold-500 hover:underline">Back Side ↗</a>}
                    </div>
                  ) : 'No Doc'}
                </td>
                <td className="px-4 py-3"><span className="badge badge-gold">{account.kycStatus}</span></td>
                <td className="px-4 py-3 text-xs text-text-muted">{account.kycNotes || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => runAction(() => updateKycStatus(account, 'verified', adminUser?.uid || 'unknown-admin'), 'KYC verified')} className="btn-gold h-9 px-3 text-xs">Verify</button>
                    <button onClick={() => runAction(() => updateKycStatus(account, 'rejected', adminUser?.uid || 'unknown-admin', 'Rejected by admin review'), 'KYC rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

          {/* ── Wallets ── */}
          {activeSection === 'wallets' && <Section title="Wallet Whitelist Review">
          <Table headers={['User', 'Label', 'Address', 'Status', 'Actions']}>
            {pendingWallets.length === 0 ? <EmptyRow colSpan={5} label="No pending wallet requests." /> : pendingWallets.map((wallet) => (
              <tr key={wallet.id} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(wallet.uid)?.displayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(wallet.uid)?.email || wallet.uid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-white">{wallet.label || 'BEP20 wallet'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[320px] truncate">{wallet.address}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{wallet.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => runAction(() => updateWalletStatus(wallet.uid, wallet.id, 'approved', adminUser?.uid || 'unknown-admin'), 'Wallet approved')} className="btn-gold h-9 px-3 text-xs">Approve</button>
                    <button onClick={() => runAction(() => updateWalletStatus(wallet.uid, wallet.id, 'rejected', adminUser?.uid || 'unknown-admin'), 'Wallet rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

          {/* ── Approvals ── */}
          {activeSection === 'approvals' && <Section title="Maker-Checker Approvals">
          <Table headers={['Date', 'Action', 'Maker', 'User', 'Amount', 'Status', 'Actions']}>
            {approvalRequests.length === 0 ? <EmptyRow colSpan={7} label="No approval requests." /> : approvalRequests.slice(0, 80).map((request) => (
              <tr key={request.id} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                <td className="px-4 py-3 text-text-secondary">{request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{request.action}</span></td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(request.requestedBy)?.displayName || 'Admin'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(request.requestedBy)?.email || request.requestedBy}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(request.targetUid)?.displayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(request.targetUid)?.email || request.targetUid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-white">{typeof request.amount === 'number' ? `$${request.amount.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{request.status}</span></td>
                <td className="px-4 py-3">
                  {request.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => runAction(async () => {
                        if (request.action === 'profit_add') {
                          const investmentId = request.payload?.investmentId;
                          const investment = investments.find((item) => item.id === investmentId && item.uid === request.targetUid);
                          if (!investment || typeof request.amount !== 'number') throw new Error('Linked investment not found.');
                          await addInvestmentProfit(investment, request.amount, adminUser?.uid || 'unknown-admin');
                        }
                        await reviewApprovalRequest(request, 'approved', adminUser?.uid || 'unknown-admin');
                      }, 'Approval executed')} className="btn-gold h-9 px-3 text-xs">Approve</button>
                      <button onClick={() => runAction(() => reviewApprovalRequest(request, 'rejected', adminUser?.uid || 'unknown-admin'), 'Approval rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                    </div>
                  ) : <span className="text-xs text-text-muted">Reviewed by {request.reviewedBy || '-'}</span>}
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

          {/* ── Audit Log ── */}
          {activeSection === 'audit' && <Section title="Admin Audit Log" onExport={() => downloadCSV(auditLogs.map(l => ({ date: l.createdAt, action: l.action, admin: findUser(l.actorUid)?.email || l.actorUid, user: findUser(l.targetUid)?.email || l.targetUid, amount: l.amount, record: `${l.collection}/${l.recordId}` })), 'goldex_audit_log')}>
          <Table headers={['Date', 'Action', 'Admin', 'User', 'Amount', 'Record']}>
            {auditLogs.length === 0 ? <EmptyRow colSpan={6} label="No admin actions recorded yet." /> : auditLogs.slice(0, 50).map((log) => (
              <tr key={log.id} className="border-b border-gold-500/10 hover:bg-dark-800/20 transition-colors">
                <td className="px-4 py-3 text-text-secondary">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{log.action}</span></td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(log.actorUid)?.displayName || 'Admin'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(log.actorUid)?.email || log.actorUid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(log.targetUid)?.displayName || '-'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(log.targetUid)?.email || log.targetUid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-white">{typeof log.amount === 'number' ? `$${log.amount.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{log.collection}/{log.recordId}</td>
              </tr>
            ))}
          </Table>
        </Section>}

          {/* ── Support ── */}
          {activeSection === 'support' && <Section title="Live Support Tickets">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-4">
            {/* Tickets list */}
            <div className="xl:col-span-4 border border-gold-500/10 rounded-2xl bg-dark-900/30 overflow-hidden flex flex-col max-h-[500px]">
              <div className="p-4 border-b border-gold-500/10 bg-dark-950/60 font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gold-500" /> Tickets
                <span className="ml-auto font-mono text-xs text-text-muted">{tickets.length}</span>
              </div>
              <div className="divide-y divide-gold-500/10 overflow-y-auto flex-1">
                {tickets.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs">No tickets submitted.</div>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSendEmailChecked(true);
                      }}
                      className={`w-full text-left p-4 hover:bg-dark-800/20 transition-colors flex items-center justify-between gap-3 ${selectedTicket?.id === ticket.id ? 'bg-gold-500/5' : ''}`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-profit-green'}`} />
                          <p className="text-sm text-white font-medium truncate">{ticket.subject}</p>
                        </div>
                        <p className="text-xs text-text-muted truncate">{ticket.message}</p>
                        <p className="text-[10px] text-text-secondary font-mono truncate">{ticket.email}</p>
                      </div>
                      {ticket.replies && ticket.replies.length > 0 && (
                        <span className="text-[10px] text-gold-500 font-mono bg-gold-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {ticket.replies.length}R
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Ticket details & Reply */}
            <div className="xl:col-span-8 border border-gold-500/10 rounded-2xl bg-dark-900/30 overflow-hidden flex flex-col min-h-[400px] max-h-[500px]">
              {selectedTicket ? (
                <>
                  <div className="p-4 border-b border-gold-500/10 bg-dark-950/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{selectedTicket.subject}</h4>
                      <p className="text-xs text-text-muted">User: {selectedTicket.name} ({selectedTicket.email})</p>
                    </div>
                    <span className="badge badge-gold shrink-0">
                      {selectedTicket.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                  </div>

                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* Original Message */}
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="rounded-xl rounded-tl-none bg-dark-950 border border-gold-500/10 p-3 text-sm text-white">
                        <p className="text-[10px] text-gold-500 font-semibold mb-1">{selectedTicket.name}</p>
                        {selectedTicket.message}
                      </div>
                      <span className="text-[9px] text-text-muted mt-1 ml-1 font-mono">
                        {selectedTicket.createdAt?.toDate ? selectedTicket.createdAt.toDate().toLocaleString() : 'Just now'}
                      </span>
                    </div>

                    {/* Replies */}
                    {selectedTicket.replies?.map((reply: SupportTicket['replies'][number], idx: number) => {
                      const isAdminReply = reply.sender === 'admin';
                      return (
                        <div key={idx} className={`flex flex-col max-w-[85%] ${isAdminReply ? 'ml-auto items-end' : 'items-start'}`}>
                          <div className={`rounded-xl p-3 text-sm ${isAdminReply ? 'rounded-tr-none bg-gold-500/10 border border-gold-500/20 text-white' : 'rounded-tl-none bg-dark-950 border border-gold-500/10 text-white'}`}>
                            <p className={`text-[10px] font-semibold mb-1 ${isAdminReply ? 'text-gold-500' : 'text-text-secondary'}`}>
                              {isAdminReply ? '🛡️ Support (You)' : selectedTicket.name}
                            </p>
                            {reply.message}
                          </div>
                          <span className="text-[9px] text-text-muted mt-1 mr-1 font-mono">
                            {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : reply.createdAt?.toLocaleString ? reply.createdAt.toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleAdminReply} className="p-4 border-t border-gold-500/10 bg-dark-950/40 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox" id="send-email-check"
                        checked={sendEmailChecked}
                        onChange={(e) => setSendEmailChecked(e.target.checked)}
                        className="rounded border-gold-500/30 text-gold-500 bg-dark-900 focus:ring-0 focus:ring-offset-0"
                      />
                      <label htmlFor="send-email-check" className="text-xs text-text-secondary select-none">
                        Send email reply notification to user's registered email ({selectedTicket.email})
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text" required
                        value={adminReplyMsg}
                        onChange={(e) => setAdminReplyMsg(e.target.value)}
                        placeholder="Type reply message..."
                        disabled={replySubmitting}
                        className="flex-1 bg-dark-900 border border-gold-500/20 focus:border-gold-500 rounded-xl px-4 py-2 text-sm text-white focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={replySubmitting || !adminReplyMsg.trim()}
                        className="btn-gold h-10 px-4 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-12">
                  <MessageSquare className="w-12 h-12 text-gold-500/25 mb-3" />
                  <p className="text-sm">Select a ticket from the left panel to reply.</p>
                </div>
              )}
            </div>
          </div>
        </Section>}
      </main>
      </div>
    </div>
  );
}

// ─── Helper Components ───────────────────────────────────────────────

function Section({ title, children, onExport }: { title: string; children: React.ReactNode; onExport?: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-gold-500/10 overflow-hidden bg-dark-950/80 backdrop-blur-sm"
    >
      <div className="p-5 border-b border-gold-500/10 flex items-center justify-between">
        <h2 className="text-lg font-display text-white">{title}</h2>
        {onExport && (
          <button onClick={onExport} className="btn-ghost h-9 px-3 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-text-muted uppercase bg-dark-900/60">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-text-muted">{label}</td>
    </tr>
  );
}
