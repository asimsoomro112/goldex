import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { MIN_PROFIT_WITHDRAWAL, createWithdrawalRequest, useDashboardData, useWalletWhitelist } from '@/lib/dashboardData';

export function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [investmentId, setInvestmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { investments, totals, withdrawals } = useDashboardData(user?.uid);
  const { wallets } = useWalletWhitelist(user?.uid);
  const approvedWallets = wallets.filter((wallet) => wallet.status === 'approved');
  const pendingWithdrawalTotal = withdrawals
    .filter((withdrawal) => withdrawal.status === 'pending')
    .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);
  const availableProfit = Math.max(0, totals.withdrawableProfit - pendingWithdrawalTotal);
  const lockedPrincipal = totals.lockedPrincipal;

  const pendingByInvestment = (invId: string) => withdrawals
    .filter((w) => w.status === 'pending' && w.investmentId === invId)
    .reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const eligibleInvestments = investments.filter((investment) => {
    const invAvailable = Number(investment.profitAvailable || 0) - pendingByInvestment(investment.id);
    return investment.status === 'active' && invAvailable >= MIN_PROFIT_WITHDRAWAL;
  });
  const selectedInvestment = investments.find((investment) => investment.id === investmentId);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentId || !selectedInvestment) {
      toast.error('Select the investment you want to settle.');
      return;
    }
    const invAvailable = Number(selectedInvestment.profitAvailable || 0) - pendingByInvestment(selectedInvestment.id);
    if (Number(amount) > availableProfit) {
      toast.error('Insufficient live profit');
      return;
    }
    if (Number(amount) > invAvailable) {
      toast.error("Amount is higher than this investment's remaining available profit.");
      return;
    }
    if (Number(amount) < MIN_PROFIT_WITHDRAWAL) {
      toast.error('Minimum profit withdrawal is $50.00');
      return;
    }
    if (!walletAddress.trim()) {
      toast.error('Select your approved USDT BEP20 wallet');
      return;
    }
    if (!approvedWallets.some((wallet) => wallet.address.toLowerCase() === walletAddress.trim().toLowerCase())) {
      toast.error('Wallet must be approved in Settings before withdrawal.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      await createWithdrawalRequest(user.uid, Number(amount), walletAddress.trim(), investmentId);
      await sendEmail('withdrawal_request', {
        to: user.email,
        name: user.displayName,
        data: { amount: Number(amount), walletAddress: walletAddress.trim(), investmentId },
      });
      toast.success('Profit withdrawal request submitted');
      setAmount('');
      setInvestmentId('');
    } catch (error: any) {
      toast.error(error.message || 'Could not submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full pt-6">
      <div className="text-center mb-6">
        <p className="t-label text-text-secondary mb-4">Available Live Profit</p>
        <h1 className="t-hero text-gold mb-3">${availableProfit.toFixed(2)}</h1>
        <p className="font-sans text-[14px] text-text-muted">Only profit can be withdrawn. Locked principal remains invested.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="gc p-8 md:p-10 border-[#D4AF37]/15 relative overflow-hidden flex flex-col">
          <form onSubmit={handleWithdraw} className="space-y-8 relative z-10 flex flex-col flex-1">
            <div>
              <label className="font-sans text-[14px] font-medium text-text-secondary mb-3 block">Profit Withdrawal Amount (USD)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="font-mono text-[24px] text-gold">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={MIN_PROFIT_WITHDRAWAL}
                  max={availableProfit}
                  className="w-full bg-[rgba(7,7,13,0.60)] border border-[#D4AF37]/20 focus:border-[#D4AF37]/60 rounded-[14px] py-[24px] pl-[36px] pr-[80px] text-white font-mono text-[36px] focus:outline-none transition-colors shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] placeholder-text-muted/30 text-center"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setAmount(availableProfit.toString())}
                  className="absolute inset-y-0 right-4 flex items-center"
                >
                  <span className="bg-[#D4AF37]/10 text-gold border border-[#D4AF37]/30 px-3 py-1.5 rounded-full font-sans text-[11px] font-bold tracking-wider hover:bg-[#D4AF37]/20 transition-colors cursor-none">MAX</span>
                </button>
              </div>
              <div className="flex justify-center mt-3">
                <p className="font-sans text-[12px] text-text-muted">Min $50 profit - Max ${availableProfit.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-dark-900/50 border border-gold-500/10 rounded-xl p-4 space-y-3">
              <div>
                <label className="font-sans text-[13px] font-medium text-text-secondary mb-2 block">Settle Investment</label>
                <select value={investmentId} onChange={(event) => setInvestmentId(event.target.value)} className="input-gold text-[14px]" required>
                  <option value="">Select eligible investment</option>
                  {eligibleInvestments.map((investment) => {
                    const invAvailable = Number(investment.profitAvailable || 0) - pendingByInvestment(investment.id);
                    return (
                      <option key={investment.id} value={investment.id}>
                        ${Number(investment.amount || 0).toFixed(2)} plan - ${invAvailable.toFixed(2)} profit available
                      </option>
                    );
                  })}
                </select>
                {eligibleInvestments.length === 0 && <p className="text-xs text-text-muted mt-2">No active investment has reached $50 profit yet.</p>}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Locked Principal</span>
                <span className="font-mono text-white">${lockedPrincipal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Pending Withdrawals</span>
                <span className="font-mono text-white">${pendingWithdrawalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Withdrawal Rule</span>
                <span className="text-text-muted">Profit must reach $50</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">After this profit withdrawal is marked paid, the selected investment stops generating daily profit.</p>
            </div>

            <div className="flex-1">
              <label className="font-sans text-[14px] font-medium text-text-secondary mb-3 block">Withdrawal Method</label>
              <div className="gc p-4 flex flex-col items-center justify-center gap-3 border bg-[#D4AF37]/10 border-[#D4AF37]/60 text-gold">
                <div className="w-6 h-6 rounded-full border-[2px] border-current flex items-center justify-center">
                  <span className="text-[12px] font-bold">T</span>
                </div>
                <span className="font-sans text-[13px] font-medium">USDT (BEP20)</span>
              </div>
            </div>

            <div className="mt-auto">
              <button type="submit" disabled={submitting} className="btn-gold w-full h-[56px] text-[16px] rounded-[14px] disabled:opacity-60">
                {submitting ? 'Submitting...' : 'Request Profit Withdrawal'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-10">
          <div className="gc p-6 border-[#D4AF37]/15 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="font-display font-medium text-[18px] text-white">USDT BEP20 Wallet</h3>
            <select value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="input-gold font-mono text-[14px]" required>
              <option value="">Select approved wallet</option>
              {approvedWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.address}>{wallet.label || 'BEP20 wallet'} - {wallet.address.slice(0, 8)}...</option>
              ))}
            </select>
            {approvedWallets.length === 0 && <p className="text-xs text-text-muted mt-2">Add and approve a wallet from Settings before withdrawal.</p>}
          </div>

          <div className="gc p-0 overflow-hidden h-fit border-[#D4AF37]/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex-1 flex flex-col">
            <div className="p-[20px_24px] border-b border-gold-500/10">
              <h3 className="font-display font-medium text-[18px] text-white">Profit Withdrawal History</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-[#11111F]/50 font-sans text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Investment</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Receipt</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[14px]">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-muted relative overflow-hidden">
                        <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                          <img src="/images/Empty Transactions.png" alt="No Withdrawals" className="w-28 h-28 object-contain opacity-75 mb-2 drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
                          <p className="text-sm max-w-xs">No live withdrawal history.</p>
                        </div>
                      </td>
                    </tr>
                  ) : withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-[#D4AF37]/5 hover:bg-[#11111F]/50 transition-colors">
                      <td className="px-6 py-4 text-text-secondary">{withdrawal.createdAt?.toDate ? withdrawal.createdAt.toDate().toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 text-white font-mono font-medium">${Number(withdrawal.amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-text-secondary">USDT BEP20</td>
                      <td className="px-6 py-4 font-mono text-xs text-text-muted">{withdrawal.investmentId || '-'}</td>
                       <td className="px-6 py-4">
                         <div>
                           <span className="badge badge-gold">{withdrawal.status}</span>
                           {withdrawal.status === 'rejected' && (
                             <div className="mt-2 text-[11px] text-[#EF4444] max-w-[200px] leading-relaxed">
                               <span className="font-semibold">Reason:</span> {withdrawal.rejectionReason || 'Incorrect wallet address or audit failed.'}
                               <div className="mt-1 font-medium text-gold-500 hover:text-gold-400">
                                 Please verify your details or contact support.
                               </div>
                             </div>
                           )}
                         </div>
                       </td>
                      <td className="px-6 py-4 font-mono text-xs text-text-muted break-all">{withdrawal.payoutTxHash || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
