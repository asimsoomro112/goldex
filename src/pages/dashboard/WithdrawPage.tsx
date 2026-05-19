import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { MIN_PROFIT_WITHDRAWAL, createWithdrawalRequest, useDashboardData, useWalletWhitelist, reinvestProfit } from '@/lib/dashboardData';
import { Clock, Zap, Coins, ArrowRightLeft, Check, ShieldAlert } from 'lucide-react';

export function WithdrawPage() {
  const [activeTab, setActiveTab] = useState<'withdraw' | 'reinvest'>('withdraw');

  // Withdrawal form states
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [investmentId, setInvestmentId] = useState('');
  const [withdrawalSpeed, setWithdrawalSpeed] = useState<'standard' | 'express'>('standard');
  const [submitting, setSubmitting] = useState(false);

  // Reinvestment form states
  const [reinvestAmount, setReinvestAmount] = useState('');
  const [sourceInvestmentId, setSourceInvestmentId] = useState('');
  const [targetInvestmentId, setTargetInvestmentId] = useState(''); // Empty means new portfolio
  const [reinvesting, setReinvesting] = useState(false);

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

  // Calculate Withdrawal Payouts
  const parsedAmount = Number(amount) || 0;
  const feeRate = withdrawalSpeed === 'express' ? 0.12 : 0.08;
  const feeAmount = parsedAmount * feeRate;
  const netPayout = Math.max(0, parsedAmount - feeAmount);

  // Calculate Reinvestment Payouts
  const parsedReinvest = Number(reinvestAmount) || 0;
  const compoundingBonus = parsedReinvest * 0.05;
  const totalAllocation = parsedReinvest + compoundingBonus;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investmentId || !selectedInvestment) {
      toast.error('Select the investment you want to withdraw from.');
      return;
    }
    const invAvailable = Number(selectedInvestment.profitAvailable || 0) - pendingByInvestment(selectedInvestment.id);
    if (parsedAmount > availableProfit) {
      toast.error('Insufficient live profit.');
      return;
    }
    if (parsedAmount > invAvailable) {
      toast.error("Amount is higher than this investment's remaining available profit.");
      return;
    }
    if (parsedAmount < MIN_PROFIT_WITHDRAWAL) {
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
      await createWithdrawalRequest(
        user.uid,
        parsedAmount,
        walletAddress.trim(),
        investmentId,
        withdrawalSpeed,
        feeAmount
      );
      await sendEmail('withdrawal_request', {
        to: user.email,
        name: user.displayName,
        data: { amount: parsedAmount, walletAddress: walletAddress.trim(), investmentId, speed: withdrawalSpeed, fee: feeAmount },
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

  const handleReinvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceInvestmentId) {
      toast.error('Select the source portfolio to reinvest from.');
      return;
    }
    const sourceInvestment = investments.find((i) => i.id === sourceInvestmentId);
    if (!sourceInvestment) return;

    const sourceAvailable = Number(sourceInvestment.profitAvailable || 0) - pendingByInvestment(sourceInvestmentId);
    if (parsedReinvest > availableProfit) {
      toast.error('Insufficient live profit.');
      return;
    }
    if (parsedReinvest > sourceAvailable) {
      toast.error("Amount is higher than this source portfolio's available profit.");
      return;
    }
    if (parsedReinvest < MIN_PROFIT_WITHDRAWAL) {
      toast.error('Minimum compounding reinvestment is $50.00');
      return;
    }
    if (!user) return;

    setReinvesting(true);
    try {
      await reinvestProfit(user.uid, parsedReinvest, sourceInvestmentId, targetInvestmentId || undefined);
      toast.success('Compound reinvestment successful!');
      setReinvestAmount('');
      setSourceInvestmentId('');
      setTargetInvestmentId('');
    } catch (error: any) {
      toast.error(error.message || 'Compounding failed.');
    } finally {
      setReinvesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full pt-6">
      <div className="text-center mb-4">
        <p className="t-label text-text-secondary mb-2">Available Live Profit</p>
        <h1 className="t-hero text-gold mb-2">${availableProfit.toFixed(2)}</h1>
        <p className="font-sans text-[13px] text-text-muted">
          Only profit can be withdrawn. Capital allocation remains permanently active to secure ongoing daily yields.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center border-b border-gold-500/10 mb-2">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`pb-4 px-2 font-display text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'withdraw'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            Withdraw Profit
          </button>
          <button
            onClick={() => setActiveTab('reinvest')}
            className={`pb-4 px-2 font-display text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'reinvest'
                ? 'border-gold-500 text-gold-500'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            Compound Reinvest (+5% Bonus)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="gc p-8 border-gold-500/15 relative overflow-hidden flex flex-col">
          {activeTab === 'withdraw' ? (
            <form onSubmit={handleWithdraw} className="space-y-6 relative z-10 flex flex-col flex-1">
              <div>
                <label className="font-sans text-[13px] font-medium text-text-secondary mb-2 block">
                  Profit Withdrawal Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="font-mono text-[20px] text-gold">$</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min={MIN_PROFIT_WITHDRAWAL}
                    max={availableProfit}
                    className="w-full bg-dark-900/60 border border-gold-500/20 focus:border-gold-500/60 rounded-xl py-4 pl-10 pr-20 text-white font-mono text-[28px] focus:outline-none transition-colors text-center"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(availableProfit.toString())}
                    className="absolute inset-y-0 right-4 flex items-center"
                  >
                    <span className="bg-gold-500/10 text-gold border border-gold-500/30 px-3 py-1.5 rounded-full font-sans text-[11px] font-bold tracking-wider hover:bg-gold-500/20 transition-colors">
                      MAX
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-sans text-[13px] font-medium text-text-secondary mb-2 block">
                  Settle From Portfolio
                </label>
                <select
                  value={investmentId}
                  onChange={(event) => setInvestmentId(event.target.value)}
                  className="input-gold text-[13px]"
                  required
                >
                  <option value="">Select source portfolio</option>
                  {eligibleInvestments.map((investment) => {
                    const invAvailable = Number(investment.profitAvailable || 0) - pendingByInvestment(investment.id);
                    return (
                      <option key={investment.id} value={investment.id}>
                        Portfolio ${Number(investment.amount || 0).toFixed(0)} - ${invAvailable.toFixed(2)} available
                      </option>
                    );
                  })}
                </select>
                {eligibleInvestments.length === 0 && (
                  <p className="text-xs text-text-muted mt-2">
                    No active portfolio has reached the minimum $50 profit threshold.
                  </p>
                )}
              </div>

              {/* Speed Tier Selection */}
              <div>
                <label className="font-sans text-[13px] font-medium text-text-secondary mb-3 block">
                  Withdrawal Speed Tier
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawalSpeed('standard')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      withdrawalSpeed === 'standard'
                        ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                        : 'border-gold-500/10 bg-dark-900/40 text-text-secondary hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Standard
                    </span>
                    <span className="text-[10px] text-text-muted mt-1">24-48 Hours Payout</span>
                    <span className="text-xs font-mono font-medium mt-2">8% Processing Fee</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawalSpeed('express')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      withdrawalSpeed === 'express'
                        ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                        : 'border-gold-500/10 bg-dark-900/40 text-text-secondary hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      Express
                    </span>
                    <span className="text-[10px] text-text-muted mt-1">Under 1 Hour Payout</span>
                    <span className="text-xs font-mono font-medium mt-2">12% Processing Fee</span>
                  </button>
                </div>
              </div>

              {/* Calculations Box */}
              <div className="bg-dark-900/50 border border-gold-500/10 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Withdrawal Amount</span>
                  <span className="font-mono text-white">${parsedAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Processing Fee ({withdrawalSpeed === 'express' ? '12%' : '8%'})</span>
                  <span className="font-mono text-danger">${feeAmount.toFixed(2)}</span>
                </div>
                <hr className="border-gold-500/10 my-1" />
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gold-500">Net Expected Payout</span>
                  <span className="font-mono text-gold-500">${netPayout.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button
                  type="submit"
                  disabled={submitting || eligibleInvestments.length === 0}
                  className="btn-gold w-full h-[52px] text-sm rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Submitting Request...' : 'Request Profit Withdrawal'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReinvest} className="space-y-6 relative z-10 flex flex-col flex-1">
              <div>
                <label className="font-sans text-[13px] font-medium text-text-secondary mb-2 block">
                  Reinvestment Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="font-mono text-[20px] text-gold">$</span>
                  </div>
                  <input
                    type="number"
                    value={reinvestAmount}
                    onChange={(e) => setReinvestAmount(e.target.value)}
                    required
                    min={MIN_PROFIT_WITHDRAWAL}
                    max={availableProfit}
                    className="w-full bg-dark-900/60 border border-gold-500/20 focus:border-gold-500/60 rounded-xl py-4 pl-10 pr-20 text-white font-mono text-[28px] focus:outline-none transition-colors text-center"
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setReinvestAmount(availableProfit.toString())}
                    className="absolute inset-y-0 right-4 flex items-center"
                  >
                    <span className="bg-gold-500/10 text-gold border border-gold-500/30 px-3 py-1.5 rounded-full font-sans text-[11px] font-bold tracking-wider hover:bg-gold-500/20 transition-colors">
                      MAX
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-sans text-[13px] font-medium text-text-secondary mb-2 block">
                  Source Portfolio (Debit Profit)
                </label>
                <select
                  value={sourceInvestmentId}
                  onChange={(event) => setSourceInvestmentId(event.target.value)}
                  className="input-gold text-[13px]"
                  required
                >
                  <option value="">Select source portfolio</option>
                  {eligibleInvestments.map((investment) => {
                    const invAvailable = Number(investment.profitAvailable || 0) - pendingByInvestment(investment.id);
                    return (
                      <option key={investment.id} value={investment.id}>
                        Portfolio ${Number(investment.amount || 0).toFixed(0)} - ${invAvailable.toFixed(2)} available
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-sans text-[13px] font-medium text-text-secondary mb-2 block">
                  Compounding Destination
                </label>
                <select
                  value={targetInvestmentId}
                  onChange={(event) => setTargetInvestmentId(event.target.value)}
                  className="input-gold text-[13px]"
                >
                  <option value="">Create New Portfolio (+5% Bonus)</option>
                  {investments
                    .filter((i) => i.status === 'active')
                    .map((investment) => (
                      <option key={investment.id} value={investment.id}>
                        Top-Up Portfolio ${Number(investment.amount || 0).toFixed(0)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Calculations Box */}
              <div className="bg-dark-900/50 border border-gold-500/10 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reinvestment Amount</span>
                  <span className="font-mono text-white">${parsedReinvest.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Compounding Bonus (5%)</span>
                  <span className="font-mono text-gold-500">+${compoundingBonus.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Processing Fee</span>
                  <span className="font-mono text-gold-500">0.00% (FREE)</span>
                </div>
                <hr className="border-gold-500/10 my-1" />
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gold-500">Total Capital Credit</span>
                  <span className="font-mono text-gold-500">${totalAllocation.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button
                  type="submit"
                  disabled={reinvesting || eligibleInvestments.length === 0}
                  className="btn-gold w-full h-[52px] text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {reinvesting ? 'Compounding...' : 'Execute Compound Reinvest'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="gc p-6 border-gold-500/15 space-y-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h3 className="font-display font-medium text-[16px] text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-gold-500" />
              Recipient BEP20 Wallet Address
            </h3>
            <select
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="input-gold font-mono text-[14px]"
              required
            >
              <option value="">Select approved wallet</option>
              {approvedWallets.map((wallet) => (
                <option key={wallet.id} value={wallet.address}>
                  {wallet.label || 'BEP20 Wallet'} - {wallet.address.slice(0, 10)}...
                </option>
              ))}
            </select>
            {approvedWallets.length === 0 && (
              <p className="text-xs text-text-muted mt-2">
                Add and approve a wallet in Settings before requesting a payout.
              </p>
            )}
          </div>

          <div className="gc p-0 overflow-hidden h-fit border-gold-500/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex-1 flex flex-col">
            <div className="p-5 border-b border-gold-500/10">
              <h3 className="font-display font-medium text-[16px] text-white">Profit Withdrawal History</h3>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-[#11111F]/50 font-sans text-[11px] uppercase tracking-wider text-text-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Fee</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-[13px]">
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-text-muted relative overflow-hidden">
                        <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                          <p className="text-sm">No live withdrawal history.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b border-gold-500/5 hover:bg-[#11111F]/50 transition-colors">
                        <td className="px-6 py-4 text-text-secondary">
                          {withdrawal.createdAt?.toDate ? withdrawal.createdAt.toDate().toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-white font-mono font-medium">
                          ${Number(withdrawal.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-text-secondary font-mono">
                          {withdrawal.fee ? `$${Number(withdrawal.fee).toFixed(2)}` : 'FREE'}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="badge badge-gold">
                              {withdrawal.type === 'settlement' ? 'settling:' : ''} {withdrawal.status}
                            </span>
                            {withdrawal.status === 'rejected' && (
                              <div className="mt-2 text-[10px] text-danger max-w-[180px] leading-relaxed">
                                <span className="font-semibold">Reason:</span>{' '}
                                {withdrawal.rejectionReason || 'Compliance audit failed.'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-text-muted break-all">
                          {withdrawal.payoutTxHash || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
