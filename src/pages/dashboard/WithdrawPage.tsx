import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import {
  MIN_PROFIT_WITHDRAWAL,
  createWithdrawalRequest,
  reinvestProfit,
  useDashboardData,
  useWalletWhitelist,
} from '@/lib/dashboardData';
import { 
  ArrowRightLeft, 
  Clock, 
  Coins, 
  History, 
  Wallet, 
  Zap,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';

export function WithdrawPage() {
  const [activeTab, setActiveTab] = useState<'withdraw' | 'reinvest'>('withdraw');

  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [investmentId, setInvestmentId] = useState('');
  const [withdrawalSpeed, setWithdrawalSpeed] = useState<'standard' | 'express'>('standard');
  const [submitting, setSubmitting] = useState(false);

  const [reinvestAmount, setReinvestAmount] = useState('');
  const [sourceInvestmentId, setSourceInvestmentId] = useState('');
  const [targetInvestmentId, setTargetInvestmentId] = useState('');
  const [reinvesting, setReinvesting] = useState(false);

  const { user } = useAuth();
  const { investments, totals, withdrawals } = useDashboardData(user?.uid);
  const { wallets } = useWalletWhitelist(user?.uid);
  const approvedWallets = wallets.filter((wallet) => wallet.status === 'approved');

  const pendingWithdrawalTotal = useMemo(() => {
    return withdrawals
      .filter((withdrawal) => withdrawal.status === 'pending')
      .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);
  }, [withdrawals]);

  const availableProfit = useMemo(() => {
    return Math.max(0, totals.withdrawableProfit - pendingWithdrawalTotal);
  }, [totals.withdrawableProfit, pendingWithdrawalTotal]);

  const lockedPrincipal = totals.lockedPrincipal;

  const pendingByInvestment = (invId: string) => {
    return withdrawals
      .filter((w) => w.status === 'pending' && w.investmentId === invId)
      .reduce((sum, w) => sum + Number(w.amount || 0), 0);
  };

  const eligibleInvestments = useMemo(() => {
    return investments.filter((investment) => {
      const invAvailable = Number(investment.profitAvailable || 0) - pendingByInvestment(investment.id);
      return investment.status === 'active' && invAvailable >= MIN_PROFIT_WITHDRAWAL;
    });
  }, [investments, withdrawals]);

  // Set default investment source if eligible is available
  useEffect(() => {
    if (eligibleInvestments.length > 0 && !investmentId) {
      setInvestmentId(eligibleInvestments[0].id);
    }
  }, [eligibleInvestments, investmentId]);

  // Set default source for reinvest
  useEffect(() => {
    if (eligibleInvestments.length > 0 && !sourceInvestmentId) {
      setSourceInvestmentId(eligibleInvestments[0].id);
    }
  }, [eligibleInvestments, sourceInvestmentId]);

  // Set default wallet
  useEffect(() => {
    if (approvedWallets.length > 0 && !walletAddress) {
      setWalletAddress(approvedWallets[0].address);
    }
  }, [approvedWallets, walletAddress]);

  const selectedInvestment = useMemo(() => {
    return investments.find((investment) => investment.id === investmentId);
  }, [investments, investmentId]);

  const selectedInvestmentAvailable = useMemo(() => {
    return selectedInvestment
      ? Math.max(0, Number(selectedInvestment.profitAvailable || 0) - pendingByInvestment(selectedInvestment.id))
      : 0;
  }, [selectedInvestment, withdrawals]);

  const withdrawMax = useMemo(() => {
    return selectedInvestment ? Math.min(availableProfit, selectedInvestmentAvailable) : availableProfit;
  }, [selectedInvestment, availableProfit, selectedInvestmentAvailable]);

  const parsedAmount = Number(amount) || 0;
  const feeRate = withdrawalSpeed === 'express' ? 0.12 : 0.08;
  const feeAmount = parsedAmount * feeRate;
  const netPayout = Math.max(0, parsedAmount - feeAmount);

  const parsedReinvest = Number(reinvestAmount) || 0;
  const compoundingBonus = parsedReinvest * 0.05;
  const totalAllocation = parsedReinvest + compoundingBonus;

  const selectedSourceInvestment = useMemo(() => {
    return investments.find((investment) => investment.id === sourceInvestmentId);
  }, [investments, sourceInvestmentId]);

  const selectedSourceAvailable = useMemo(() => {
    return selectedSourceInvestment
      ? Math.max(0, Number(selectedSourceInvestment.profitAvailable || 0) - pendingByInvestment(selectedSourceInvestment.id))
      : 0;
  }, [selectedSourceInvestment, withdrawals]);

  const reinvestMax = useMemo(() => {
    return selectedSourceInvestment ? Math.min(availableProfit, selectedSourceAvailable) : availableProfit;
  }, [selectedSourceInvestment, availableProfit, selectedSourceAvailable]);

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
      try {
        await sendEmail('withdrawal_request', {
          to: user.email,
          name: user.displayName,
          data: { amount: parsedAmount, walletAddress: walletAddress.trim(), investmentId, speed: withdrawalSpeed, fee: feeAmount },
        });
      } catch (emailErr) {
        console.warn('Email dispatch failed:', emailErr);
      }
      toast.success('Profit withdrawal request submitted');
      setAmount('');
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
    } catch (error: any) {
      toast.error(error.message || 'Compounding failed.');
    } finally {
      setReinvesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 md:px-6">
      
      {/* Wallet Balance Hero Card */}
      <Card className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 text-white rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-[-50%] right-[-20%] w-[60%] h-[120%] bg-brand-gold/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[40%] h-[80%] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Available Compounding Profits
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
            ${availableProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
          <p className="max-w-md mx-auto text-xs text-neutral-400 leading-relaxed">
            Redeploy yields into target contracts for a 5% compounding bonus, or withdraw securely to whitelisted BEP20 wallets.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto pt-4 border-t border-neutral-800/80">
            <div>
              <p className="text-[9px] uppercase text-neutral-400 font-semibold tracking-wider">Active Capital</p>
              <p className="font-mono text-sm font-bold text-neutral-200 mt-1">${lockedPrincipal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-neutral-400 font-semibold tracking-wider">Pending Audit</p>
              <p className="font-mono text-sm font-bold text-amber-500 mt-1">${pendingWithdrawalTotal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase text-neutral-400 font-semibold tracking-wider">Min Threshold</p>
              <p className="font-mono text-sm font-bold text-brand-gold mt-1">${MIN_PROFIT_WITHDRAWAL.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Select Button Bar */}
      <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl">
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'withdraw' 
              ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-sm' 
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-transparent'
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Withdraw Yield</span>
        </button>
        <button
          onClick={() => setActiveTab('reinvest')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'reinvest' 
              ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-sm' 
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-transparent'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Compound Reinvest</span>
        </button>
      </div>

      {/* Forms Area */}
      {activeTab === 'withdraw' ? (
        <form onSubmit={handleWithdraw} className="space-y-6">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
            
            {/* Source portfolio dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Select Source Portfolio Contract
              </label>
              <select
                value={investmentId}
                onChange={(event) => setInvestmentId(event.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-800 dark:text-neutral-200"
                required
              >
                <option value="">Select source contract...</option>
                {eligibleInvestments.map((investment) => {
                  const invAvailable = Number(investment.profitAvailable || 0) - pendingByInvestment(investment.id);
                  return (
                    <option key={investment.id} value={investment.id}>
                      Contract ${Number(investment.amount || 0).toFixed(0)} — Available profit: ${invAvailable.toFixed(2)}
                    </option>
                  );
                })}
              </select>
              {eligibleInvestments.length === 0 && (
                <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No live contract has generated the minimum $50 profit threshold yet.
                </p>
              )}
            </div>

            {/* Amount entry */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Amount to Withdraw
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="font-mono text-lg font-bold text-brand-gold">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min={MIN_PROFIT_WITHDRAWAL}
                  max={withdrawMax}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-brand-gold rounded-2xl py-4 pl-10 pr-20 text-center font-mono text-2xl text-neutral-900 dark:text-neutral-50 focus:outline-none shadow-inner"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setAmount(withdrawMax.toString())}
                  className="absolute inset-y-0 right-4 flex items-center"
                >
                  <span className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-1.5 font-sans text-[10px] font-extrabold tracking-wider text-brand-gold-dark dark:text-brand-gold transition-colors hover:bg-brand-gold/20">
                    MAX
                  </span>
                </button>
              </div>
            </div>

            {/* Approved wallet dropdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Payout Whitelisted Wallet (USDT BEP20)
                </label>
                <Link to="/dashboard/settings" className="text-[10px] text-brand-gold-dark dark:text-brand-gold font-bold hover:underline">
                  Manage Whitelist ↗
                </Link>
              </div>
              <select
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs font-mono focus:outline-none text-neutral-800 dark:text-neutral-200"
                required
              >
                <option value="">Select whitelisted wallet...</option>
                {approvedWallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.address}>
                    {wallet.label || 'BEP20 Address'} - {wallet.address.slice(0, 14)}...{wallet.address.slice(-6)}
                  </option>
                ))}
              </select>
              {approvedWallets.length === 0 && (
                <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No approved whitelisted wallet found. Go to Profile Settings to whitelist a BEP20 address.
                </p>
              )}
            </div>

            {/* Payout speed selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Settlement Speed Tier
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setWithdrawalSpeed('standard')}
                  className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between ${
                    withdrawalSpeed === 'standard'
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <Clock className="h-4 w-4" />
                    Standard Payout
                  </span>
                  <span className="mt-1.5 block text-xs text-neutral-500 dark:text-neutral-400 font-semibold">24-48 Hours delivery window</span>
                  <span className="mt-3 block font-mono text-xs font-extrabold">8% network fee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawalSpeed('express')}
                  className={`rounded-2xl border p-4 text-left transition-all flex flex-col justify-between ${
                    withdrawalSpeed === 'express'
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold shadow-sm'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <Zap className="h-4 w-4" />
                    Express Payout
                  </span>
                  <span className="mt-1.5 block text-xs text-neutral-500 dark:text-neutral-400 font-semibold">Under 1 Hour delivery SLA</span>
                  <span className="mt-3 block font-mono text-xs font-extrabold text-emerald-500">12% network fee</span>
                </button>
              </div>
            </div>

            {/* Calculations Checkout */}
            <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-5 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Gross withdrawal amount</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">${parsedAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Settlement fee ({withdrawalSpeed === 'express' ? '12%' : '8%'})</span>
                <span className="font-mono text-red-500 font-bold">-${feeAmount.toFixed(2)}</span>
              </div>
              <hr className="my-1 border-neutral-200/60 dark:border-neutral-800/60" />
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-brand-gold-dark dark:text-brand-gold">Net USDT Payout</span>
                <span className="font-mono text-brand-gold-dark dark:text-brand-gold">${netPayout.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || eligibleInvestments.length === 0 || approvedWallets.length === 0}
              className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold h-12 w-full rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-gold/15 transition-transform duration-200 active:scale-95"
            >
              <span>{submitting ? 'Verifying audit queue...' : 'Confirm Withdrawal Request'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Card>
        </form>
      ) : (
        /* Reinvestment panel */
        <form onSubmit={handleReinvest} className="space-y-6">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-6">
            
            {/* Source portfolio dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Select Source Portfolio Contract
              </label>
              <select
                value={sourceInvestmentId}
                onChange={(event) => setSourceInvestmentId(event.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-800 dark:text-neutral-200"
                required
              >
                <option value="">Select source contract...</option>
                {eligibleInvestments.map((investment) => {
                  const invAvailable = Number(investment.profitAvailable || 0) - pendingByInvestment(investment.id);
                  return (
                    <option key={investment.id} value={investment.id}>
                      Contract ${Number(investment.amount || 0).toFixed(0)} — Available profit: ${invAvailable.toFixed(2)}
                    </option>
                  );
                })}
              </select>
              {eligibleInvestments.length === 0 && (
                <p className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  No live contract has generated compounding yields above $50.
                </p>
              )}
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Amount to Reinvest
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="font-mono text-lg font-bold text-brand-gold">$</span>
                </div>
                <input
                  type="number"
                  value={reinvestAmount}
                  onChange={(e) => setReinvestAmount(e.target.value)}
                  required
                  min={MIN_PROFIT_WITHDRAWAL}
                  max={reinvestMax}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 focus:border-brand-gold rounded-2xl py-4 pl-10 pr-20 text-center font-mono text-2xl text-neutral-900 dark:text-neutral-50 focus:outline-none shadow-inner"
                  placeholder="0.00"
                />
                <button
                  type="button"
                  onClick={() => setReinvestAmount(reinvestMax.toString())}
                  className="absolute inset-y-0 right-4 flex items-center"
                >
                  <span className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-3.5 py-1.5 font-sans text-[10px] font-extrabold tracking-wider text-brand-gold-dark dark:text-brand-gold transition-colors hover:bg-brand-gold/20">
                    MAX
                  </span>
                </button>
              </div>
            </div>

            {/* Target allocation destination */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Target Compounding Destination
              </label>
              <select
                value={targetInvestmentId}
                onChange={(event) => setTargetInvestmentId(event.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl px-4 py-3 text-xs focus:outline-none text-neutral-800 dark:text-neutral-200"
              >
                <option value="">Create new gold contract (+5% compounding bonus)</option>
                {investments
                  .filter((i) => i.status === 'active')
                  .map((investment) => (
                    <option key={investment.id} value={investment.id}>
                      Top up active contract ${Number(investment.amount || 0).toFixed(0)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Summary Checkout card */}
            <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-5 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Compounding capital</span>
                <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">${parsedReinvest.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Compounding reward (5% bonus)</span>
                <span className="font-mono text-emerald-500 font-bold">+${compoundingBonus.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-semibold">Compounding fee</span>
                <span className="font-mono text-emerald-500 font-bold">Free</span>
              </div>
              <hr className="my-1 border-neutral-200/60 dark:border-neutral-800/60" />
              <div className="flex justify-between text-sm font-extrabold">
                <span className="text-brand-gold-dark dark:text-brand-gold">Total Added Capital</span>
                <span className="font-mono text-brand-gold-dark dark:text-brand-gold">${totalAllocation.toFixed(2)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={reinvesting || eligibleInvestments.length === 0}
              className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold h-12 w-full rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-brand-gold/15 transition-transform duration-200 active:scale-95"
            >
              <span>{reinvesting ? 'Reinvesting...' : 'Submit Compound Request'}</span>
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
          </Card>
        </form>
      )}

      {/* WITHDRAWAL HISTORY LEDGER */}
      <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden mt-2">
        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/40 flex items-center gap-2 bg-neutral-50/20">
          <History className="h-5 w-5 text-brand-gold" />
          <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-neutral-50">
            Payout History
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50/50 dark:bg-neutral-950/20 font-sans text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200/40 dark:border-neutral-800/40">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Processing Fee</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Destination Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 text-xs">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-6 h-6 text-neutral-300 dark:text-neutral-800 mb-1" />
                      <p>No historical withdrawals found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-950/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-neutral-500 dark:text-neutral-400">
                      {withdrawal.createdAt?.toDate ? withdrawal.createdAt.toDate().toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      ${Number(withdrawal.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-500">
                      {withdrawal.fee ? `$${Number(withdrawal.fee).toFixed(2)}` : 'Free'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge 
                          variant={
                            withdrawal.status === 'paid'
                              ? 'success'
                              : withdrawal.status === 'rejected'
                              ? 'error'
                              : 'warning'
                          } 
                          text={withdrawal.status.toUpperCase()} 
                          className="text-[9px] py-0 px-2 font-bold"
                        />
                        {withdrawal.status === 'rejected' && (
                          <div className="text-[10px] text-red-500 max-w-[200px] leading-relaxed">
                            <span className="font-bold">Reason:</span> {withdrawal.rejectionReason || 'Audit compliance check failed.'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {withdrawal.payoutTxHash ? (
                        <a 
                          href={`https://bscscan.com/tx/${withdrawal.payoutTxHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="font-mono text-[10px] text-brand-gold hover:underline inline-flex items-center gap-1"
                        >
                          <span>{withdrawal.payoutTxHash.substring(0, 10)}...{withdrawal.payoutTxHash.substring(withdrawal.payoutTxHash.length - 8)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono">Processing...</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
