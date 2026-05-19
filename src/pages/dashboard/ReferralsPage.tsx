import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Users, CheckCircle2, Clock, Copy, AlertCircle, Share2, UserPlus, TrendingUp, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useDashboardData, useReferredUsers, useLedgerEntries } from '@/lib/dashboardData';

export function ReferralsPage() {
  const { user } = useAuth();
  const { profile } = useDashboardData(user?.uid);
  const { referredUsers, loading: referralsLoading } = useReferredUsers(profile?.referralCode);
  const { entries: ledgerEntries } = useLedgerEntries(user?.uid, 1000);

  const referralCode = profile?.referralCode || (user?.uid ? `GX${user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}` : '');
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied');
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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-dark-900 border border-gold-500/10 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex-1 relative z-10">
          <h1 className="text-3xl font-display font-medium text-white mb-2">Referral Center</h1>
          <p className="text-text-secondary mb-6 max-w-md">
            Invite your partners to join GoldEx. Earn a <span className="text-gold-500 font-semibold">one-time $10.00 commission</span> per $50.00 of their first investment, plus a recurring <span className="text-gold-500 font-semibold">10% profit-sharing commission</span> on all daily profits they earn!
          </p>

          <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block font-medium">Your Unique Referral Link</label>
          <div className="bg-dark-950/80 backdrop-blur-md border border-gold-500/20 rounded-xl px-4 py-3 flex items-center gap-3 max-w-xl">
            <span className="font-mono text-gold-500 break-all flex-1 text-sm">{referralLink}</span>
            <button type="button" onClick={copyReferral} className="btn-ghost h-9 px-3 shrink-0 hover:bg-gold-500/10 hover:text-gold-500 transition-colors">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="w-36 h-36 shrink-0 border border-gold-500/15 rounded-2xl bg-dark-950/80 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center relative z-10">
          <span className="font-mono text-gold-500 text-xl font-bold tracking-wide">{referralCode}</span>
          <span className="text-xs text-text-muted mt-2">Referral code</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReferralStat 
          icon={Users}
          label="Total Referred Partners" 
          value={String(totalReferredCount)} 
          description="Total users signed up with your link"
        />
        <ReferralStat 
          icon={Clock}
          label="Pending Rewards" 
          value={`$${totalPendingBonuses.toFixed(2)}`} 
          description="Waiting for first deposit/investment"
        />
        <ReferralStat 
          icon={CheckCircle2}
          label="Paid Commissions" 
          value={`$${totalPaidBonuses.toFixed(2)}`} 
          positive 
          description="Credited to your profit balance"
        />
      </div>

      {/* How It Works Steps */}
      <div className="flex flex-col gap-5">
        <h2 className="text-xl font-display font-medium text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gold-500" />
          How the Referral Program Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="bg-dark-900/40 border border-gold-500/10 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                <Share2 className="w-4.5 h-4.5 text-gold-500" />
              </div>
              <span className="text-xl font-bold font-mono text-gold-500/20">01</span>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm mb-1">Share Your Link</h3>
              <p className="text-text-muted text-xs leading-relaxed">
                Copy your unique invite link or referral code and share it with your network or partners.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-dark-900/40 border border-gold-500/10 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                <UserPlus className="w-4.5 h-4.5 text-gold-500" />
              </div>
              <span className="text-xl font-bold font-mono text-gold-500/20">02</span>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm mb-1">Partner Registers</h3>
              <p className="text-text-muted text-xs leading-relaxed">
                Your partner registers using your link. Their signup welcome bonus is added as pending.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-dark-900/40 border border-gold-500/10 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                <TrendingUp className="w-4.5 h-4.5 text-gold-500" />
              </div>
              <span className="text-xl font-bold font-mono text-gold-500/20">03</span>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm mb-1">First Investment</h3>
              <p className="text-text-muted text-xs leading-relaxed">
                They complete a first deposit & invest a <span className="text-white font-medium">minimum of $50.00</span> to activate the reward status.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-dark-900/40 border border-gold-500/10 rounded-2xl p-5 relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-center">
              <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center border border-gold-500/20">
                <Gift className="w-4.5 h-4.5 text-gold-500" />
              </div>
              <span className="text-xl font-bold font-mono text-gold-500/20">04</span>
            </div>
            <div>
              <h3 className="text-white font-medium text-sm mb-1">Rewards Released</h3>
              <p className="text-text-muted text-xs leading-relaxed">
                You get a one-time <span className="text-white font-medium">$10 per $50</span> commission (they get <span className="text-white font-medium">$5 per $50</span>) plus a <span className="text-gold-500 font-medium">10% daily share</span> on their profits!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Referrals Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gold-500/10 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-500" />
            Referred Users List
          </h3>
          <span className="text-xs text-text-muted">Real-time records</span>
        </div>
        
        {referralsLoading ? (
          <div className="p-12 text-center text-text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4" />
            Loading referred partners...
          </div>
        ) : referredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-text-muted/40 mx-auto mb-3" />
            <h4 className="text-white font-medium mb-1">No Referrals Yet</h4>
            <p className="text-sm text-text-secondary max-w-sm mx-auto">
              You haven't referred anyone yet. Share your referral link with colleagues to start earning compounding commissions together!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gold-500/10 text-xs text-text-muted uppercase tracking-wider bg-dark-950/40">
                  <th className="px-6 py-4 font-medium">Partner</th>
                  <th className="px-6 py-4 font-medium">Joined On</th>
                  <th className="px-6 py-4 font-medium">Initial Invest</th>
                  <th className="px-6 py-4 font-medium">Your Commission</th>
                  <th className="px-6 py-4 font-medium">Their Signup Reward</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/5 text-sm">
                {referredUsers.map((invitee) => {
                  const isCompleted = invitee.referralStatus === 'completed';
                  return (
                    <tr key={invitee.uid} className="hover:bg-dark-900/25 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-white">{invitee.displayName || 'Anonymous'}</div>
                        <div className="text-xs text-text-muted font-mono">{maskEmail(invitee.email)}</div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary font-mono">
                        {formatDate(invitee.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-white">
                        {isCompleted ? (
                          `$${((invitee.referralCommissionPaid || 0) * 5).toFixed(2)}`
                        ) : (
                          <span className="text-text-muted italic text-xs">Waiting...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {isCompleted ? (
                          <span className="text-profit-green font-medium">
                            +${(invitee.referralCommissionPaid || 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-text-muted text-xs font-mono">Pending ($10.00+)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-text-secondary">
                        {isCompleted ? (
                          `$${(invitee.refereeBonusPaid || 0).toFixed(2)}`
                        ) : (
                          <span className="text-text-muted text-xs font-mono">Pending ($5.00+)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Deposit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function ReferralStat({ icon: Icon, label, value, description, positive = false }: { icon: React.ComponentType<any>; label: string; value: string; description?: string; positive?: boolean }) {
  return (
    <GlassCard className="flex items-center gap-5 p-6">
      <div className="p-3.5 rounded-2xl bg-dark-950/80 border border-gold-500/15 text-gold-500 shrink-0 shadow-lg">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-text-muted uppercase tracking-wider mb-1 font-medium">{label}</p>
        <p className={`text-2xl font-mono font-bold tracking-tight ${positive ? 'text-profit-green' : 'text-white'}`}>{value}</p>
        {description && <p className="text-xs text-text-muted mt-1 leading-normal">{description}</p>}
      </div>
    </GlassCard>
  );
}
