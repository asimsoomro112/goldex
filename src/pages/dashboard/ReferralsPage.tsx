import React from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Copy, 
  AlertCircle, 
  Share2, 
  UserPlus, 
  TrendingUp, 
  Gift, 
  ArrowUpRight 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useDashboardData, useReferredUsers, useLedgerEntries } from '@/lib/dashboardData';
import { Card, Badge, Button } from '@/components/ui';

export function ReferralsPage() {
  const { user } = useAuth();
  const { profile } = useDashboardData(user?.uid);
  const { referredUsers, loading: referralsLoading } = useReferredUsers(profile?.referralCode);
  const { entries: ledgerEntries } = useLedgerEntries(user?.uid, 1000);

  const referralCode = profile?.referralCode || (user?.uid ? `GX${user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}` : '');
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  // Calculations
  const totalReferredCount = referredUsers.length;
  
  // Referee's own signup bonus (pending if status is 'pending', paid if 'completed')
  const myRefereePendingBonus = (profile?.referredBy && profile?.referralStatus === 'pending') ? 5 : 0;
  const inviteesPendingCommission = referredUsers.filter(u => u.referralStatus === 'pending').length * 10;
  const totalPendingBonuses = myRefereePendingBonus + inviteesPendingCommission;

  const myRefereePaidBonus = (profile?.referredBy && profile?.referralStatus === 'completed') ? (profile.refereeBonusPaid || 5) : 0;
  const inviteesPaidCommission = referredUsers.reduce((sum, u) => sum + (u.referralCommissionPaid || 0), 0);
  
  const referralPaidCommissionLedger = ledgerEntries.length > 0 
    ? ledgerEntries
        .filter(entry => entry.type === 'referral_commission' || entry.type === 'referral_profit_commission')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    : inviteesPaidCommission;

  const refereePaidBonusLedger = ledgerEntries.length > 0
    ? ledgerEntries
        .filter(entry => entry.type === 'referee_bonus')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    : myRefereePaidBonus;

  const totalPaidBonuses = referralPaidCommissionLedger + refereePaidBonusLedger;

  const maskEmail = (email?: string) => {
    if (!email) return '-';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [local, domain] = parts;
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
          Referral Center
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Invite partners to join GoldEx and build passive commission lines.
        </p>
      </div>

      {/* Header Promo Banner */}
      <Card className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-50%] right-[-20%] w-[60%] h-[120%] bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <Badge variant="gold" text="10% Compound Yield + $10 Contract Bonus" className="text-[10px] py-0.5 px-2.5 font-bold" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight font-display">
              Grow Compounding Commissions Together
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Earn a one-time <span className="text-brand-gold font-bold">$10.00 commission</span> when your invitees set up their first investment, plus an ongoing <span className="text-brand-gold font-bold">10% recurring yield commission</span> on all profits they accumulate.
            </p>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Your Unique Invite Link
              </label>
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2.5 flex items-center gap-3">
                <span className="font-mono text-brand-gold break-all flex-1 text-xs select-all pl-2">
                  {referralLink}
                </span>
                <Button 
                  onClick={copyReferral} 
                  className="bg-brand-gold hover:bg-brand-gold-light text-neutral-950 font-bold p-2 shrink-0 rounded-xl flex items-center justify-center transition-colors h-9"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-neutral-800/80 pt-6 lg:pt-0 lg:pl-10 flex flex-col items-center justify-center min-w-[200px] self-start lg:self-auto">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              Your Referral Code
            </span>
            <div className="border border-brand-gold/25 bg-neutral-950/80 rounded-2xl px-6 py-4 flex flex-col items-center justify-center text-center shadow-lg min-w-[160px]">
              <span className="font-mono text-brand-gold text-2xl font-extrabold tracking-wider">
                {referralCode}
              </span>
              <span className="text-[9px] text-neutral-500 font-bold mt-1 uppercase">GoldEx ID</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Referred Partners */}
        <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Referred Partners</span>
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-50 block mt-0.5">{totalReferredCount}</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">Total accounts registered</span>
          </div>
        </Card>

        {/* Pending Rewards */}
        <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Pending Commissions</span>
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-50 block mt-0.5">${totalPendingBonuses.toFixed(2)}</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">Waiting for partner deposits</span>
          </div>
        </Card>

        {/* Paid Commissions */}
        <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Paid Commissions</span>
            <span className="text-2xl font-bold font-mono text-emerald-500 block mt-0.5">${totalPaidBonuses.toFixed(2)}</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">Credited to profit balance</span>
          </div>
        </Card>
      </div>

      {/* Program Flow Breakdown */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-brand-gold" />
          Referral System Flow
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl relative overflow-hidden flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 text-brand-gold">
                <Share2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-xl font-bold font-mono text-neutral-200 dark:text-neutral-800">01</span>
            </div>
            <div>
              <h3 className="text-neutral-800 dark:text-neutral-200 font-bold text-xs mb-1">Share Invite link</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Copy your unique link and distribute it to interested investors.
              </p>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl relative overflow-hidden flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 text-brand-gold">
                <UserPlus className="w-4.5 h-4.5" />
              </div>
              <span className="text-xl font-bold font-mono text-neutral-200 dark:text-neutral-800">02</span>
            </div>
            <div>
              <h3 className="text-neutral-800 dark:text-neutral-200 font-bold text-xs mb-1">Partner Signup</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Invited users register via your link, claiming a welcome bonus.
              </p>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl relative overflow-hidden flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 text-brand-gold">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <span className="text-xl font-bold font-mono text-neutral-200 dark:text-neutral-800">03</span>
            </div>
            <div>
              <h3 className="text-neutral-800 dark:text-neutral-200 font-bold text-xs mb-1">USDT Allocation</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Partner completes a deposit and deploys a min $50 gold contract.
              </p>
            </div>
          </Card>

          {/* Step 4 */}
          <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl relative overflow-hidden flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 text-brand-gold">
                <Gift className="w-4.5 h-4.5" />
              </div>
              <span className="text-xl font-bold font-mono text-neutral-200 dark:text-neutral-800">04</span>
            </div>
            <div>
              <h3 className="text-neutral-800 dark:text-neutral-200 font-bold text-xs mb-1">Payout Dispatched</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Released bonuses credit to your profit balance + 10% daily yield shares.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Referrals table */}
      <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/40 flex items-center justify-between bg-neutral-50/20">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-gold" />
            Partners Portfolio Status
          </h3>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Real-time Sync</span>
        </div>
        
        {referralsLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-gold mx-auto mb-3" />
            Loading referred partners...
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-neutral-300 dark:text-neutral-800 mx-auto mb-2 animate-pulse" />
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No Referrals Registered</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-0.5 leading-relaxed">
              Your network is empty. Share your invite link to build compounding team commissions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50/50 dark:bg-neutral-950/20 font-sans text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200/40 dark:border-neutral-800/40">
                <tr>
                  <th className="px-6 py-4 font-semibold">Partner</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                  <th className="px-6 py-4 font-semibold">First Deposit</th>
                  <th className="px-6 py-4 font-semibold">Commission Released</th>
                  <th className="px-6 py-4 font-semibold">Signup Reward</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 text-xs">
                {referredUsers.map((invitee) => {
                  const isCompleted = invitee.referralStatus === 'completed';
                  return (
                    <tr key={invitee.uid} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-950/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-neutral-850 dark:text-neutral-200">
                          {invitee.displayName || 'Anonymous Partner'}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          {maskEmail(invitee.email)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-500">
                        {formatDate(invitee.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-800 dark:text-neutral-200 font-bold">
                        {isCompleted ? (
                          `$${((invitee.referralCommissionPaid || 0) * 5).toFixed(2)}`
                        ) : (
                          <span className="text-neutral-400 italic text-[10px]">Waiting...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {isCompleted ? (
                          <span className="text-emerald-500 font-bold">
                            +${(invitee.referralCommissionPaid || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[10px] font-mono">Pending ($10.00+)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-500">
                        {isCompleted ? (
                          `$${(invitee.refereeBonusPaid || 0).toFixed(2)}`
                        ) : (
                          <span className="text-neutral-400 text-[10px] font-mono">Pending ($5.00+)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCompleted ? (
                          <Badge 
                            variant="success" 
                            text="Active Investor" 
                            className="text-[9px] py-0 px-2 font-bold inline-flex items-center gap-1"
                          />
                        ) : (
                          <Badge 
                            variant="gold" 
                            text="Pending Deposit" 
                            className="text-[9px] py-0 px-2 font-bold inline-flex items-center gap-1"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
