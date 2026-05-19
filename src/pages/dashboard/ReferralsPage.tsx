import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Users, CheckCircle2, Clock, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useDashboardData } from '@/lib/dashboardData';

export function ReferralsPage() {
  const { user } = useAuth();
  const { profile } = useDashboardData(user?.uid);
  const referralCode = profile?.referralCode || (user?.uid ? `GX${user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}` : '');
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyReferral = async () => {
    await navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied');
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-dark-900 border border-gold-500/20 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.80]">
          <img src="/images/Gold Coin Explosion (Referral Success).png" alt="Referral Success" className="w-full h-full object-cover mix-blend-screen" />
        </div>
        <div className="flex-1 relative z-10">
          <h1 className="text-3xl font-display font-medium text-white mb-2">Referrals</h1>
          <p className="text-text-secondary mb-6 max-w-md">Share your referral link. Bonuses should only be paid after admin verifies a real deposit and the referral policy is enabled.</p>

          <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Your Unique Referral Link</label>
          <div className="bg-dark-950/80 backdrop-blur-md border border-gold-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="font-mono text-gold-500 break-all flex-1">{referralLink}</span>
            <button type="button" onClick={copyReferral} className="btn-ghost h-9 px-3">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 border border-gold-500/20 rounded-2xl bg-dark-950/80 backdrop-blur-md p-4 flex flex-col items-center justify-center text-center relative z-10">
          <span className="font-mono text-gold-500 text-lg">{referralCode}</span>
          <span className="text-xs text-text-muted mt-2">Referral code</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReferralStat img="/images/Referrals.png" label="Total Referred" value="Manual review" />
        <ReferralStat img="/images/Invest $50.png" label="Pending Bonuses" value="$0.00" />
        <ReferralStat img="/images/Gold Bar Trading.png" label="Paid Bonuses" value="$0.00" positive />
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-gold-500/10">
          <h3 className="text-lg font-medium text-white">Referral Policy</h3>
        </div>
        <div className="p-6 text-sm text-text-secondary leading-7 space-y-3">
          <p>Referral tracking starts at registration through the referral code field. Admin should verify referred users and bonuses manually before enabling payouts.</p>
          <p>Do not advertise referral earnings as guaranteed. Bonus rules should be published on Terms and reviewed before launch.</p>
        </div>
      </GlassCard>
    </div>
  );
}

function ReferralStat({ img, label, value, positive = false }: { img: string; label: string; value: string; positive?: boolean }) {
  return (
    <GlassCard className="flex items-center gap-4 p-6">
      <img src={img} alt="" className="w-12 h-12 object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.3)]" />
      <div>
        <p className="text-sm text-text-secondary mb-1">{label}</p>
        <p className={`text-xl font-mono ${positive ? 'text-profit-green' : 'text-white'}`}>{value}</p>
      </div>
    </GlassCard>
  );
}
