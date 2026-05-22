import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CircleDollarSign, 
  ArrowRight, 
  Wallet, 
  History, 
  Download, 
  Copy, 
  ShieldAlert, 
  Coins, 
  TrendingUp, 
  Check, 
  HelpCircle,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import {
  MIN_INVESTMENT,
  USDT_BEP20_ADDRESS,
  USDT_BEP20_ADDRESS_DISPLAY,
  IS_USDT_BEP20_ADDRESS_CONFIGURED,
  createDepositRequest,
  useDashboardData,
  settleAndWithdrawProfit,
  useWalletWhitelist,
  getTierForAmount,
} from '@/lib/dashboardData';
import { Button, Card, Badge, ProgressBar } from '@/components/ui';

const INVESTMENT_AMOUNTS = [50, 100, 250, 500, 1000, 2500, 5000, 10000];

export function InvestPage() {
  const [amount, setAmount] = useState<string>('50');
  const [txHash, setTxHash] = useState('');
  const [checkingTx, setCheckingTx] = useState<string | null>(null);
  const [txStatuses, setTxStatuses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  
  // Web3 state hooks
  const [depositMode, setDepositMode] = useState<'web3' | 'manual'>('web3');
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [web3Loading, setWeb3Loading] = useState(false);

  const { user } = useAuth();
  const { investments, deposits } = useDashboardData(user?.uid);
  const { wallets } = useWalletWhitelist(user?.uid);
  const approvedWallets = wallets.filter((w) => w.status === 'approved');

  const [settlingInvestment, setSettlingInvestment] = useState<any>(null);
  const [settleWalletAddress, setSettleWalletAddress] = useState('');
  const [settleSpeed, setSettleSpeed] = useState<'standard' | 'express'>('standard');
  const [settlingSubmit, setSettlingSubmit] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const isInvalid = numericAmount < MIN_INVESTMENT || numericAmount % MIN_INVESTMENT !== 0;
  const currentTier = getTierForAmount(numericAmount);
  const planName = currentTier.name;
  const depositAddressReady = IS_USDT_BEP20_ADDRESS_CONFIGURED;
  
  const minDailyProfit = numericAmount * currentTier.dailyRateMin;
  const maxDailyProfit = numericAmount * currentTier.dailyRateMax;

  // Sync settle modal default wallet
  useEffect(() => {
    if (approvedWallets.length > 0 && !settleWalletAddress) {
      setSettleWalletAddress(approvedWallets[0].address);
    }
  }, [approvedWallets, settleWalletAddress]);

  const submitDeposit = async () => {
    if (!user || isInvalid) return;
    if (!depositAddressReady) {
      toast.error('Deposit address is not configured yet. Please contact support before sending funds.');
      return;
    }

    const cleanHash = txHash.trim();
    if (!cleanHash) {
      toast.error('Transaction Hash is required as proof of deposit.');
      return;
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(cleanHash)) {
      toast.error('Please enter a valid BEP20 (BSC) Transaction Hash.');
      return;
    }

    setSubmitting(true);
    try {
      await createDepositRequest(user.uid, numericAmount, cleanHash);
      try {
        await sendEmail('deposit_request', {
          to: user.email,
          name: user.displayName,
          data: { amount: numericAmount, txHash: cleanHash },
        });
      } catch (emailErr) {
        console.warn('Email dispatch failed:', emailErr);
      }
      toast.success('Deposit request saved successfully. Our admin team will verify it.');
      setTxHash('');
    } catch (error: any) {
      toast.error(error.message || 'Could not save deposit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const connectWallet = async () => {
    if (typeof (window as any).ethereum === 'undefined') {
      toast.error('No Web3 wallet detected. Please open this in a Web3-compatible browser/app.');
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts?.[0]) {
        setConnectedWallet(accounts[0]);
        toast.success('Wallet connected!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Connection failed.');
    }
  };

  const payWithWeb3 = async () => {
    if (!user || isInvalid) return;
    if (!depositAddressReady) {
      toast.error('Deposit address is not configured yet. Please contact support before sending funds.');
      return;
    }
    if (typeof (window as any).ethereum === 'undefined') {
      toast.error('No Web3 wallet detected. Please connect MetaMask or Trust Wallet.');
      return;
    }

    setWeb3Loading(true);
    const toastId = toast.loading('Initiating Web3 Payment...');
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      setConnectedWallet(walletAddress);

      // Switch to BSC (56 / 0x38)
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'Binance Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/']
            }]
          });
        } else {
          throw switchError;
        }
      }

      const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
      const methodId = 'a9059cbb';
      const cleanDest = USDT_BEP20_ADDRESS.startsWith('0x') ? USDT_BEP20_ADDRESS.slice(2) : USDT_BEP20_ADDRESS;
      const paddedDest = cleanDest.padStart(64, '0').toLowerCase();
      const amountInWei = BigInt(numericAmount) * BigInt(10 ** 18);
      const paddedAmount = amountInWei.toString(16).padStart(64, '0').toLowerCase();
      const transferData = '0x' + methodId + paddedDest + paddedAmount;

      toast.loading('Confirming transaction in wallet...', { id: toastId });

      const hash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: USDT_CONTRACT,
          data: transferData,
        }]
      });

      toast.loading('Registering payment on platform...', { id: toastId });

      await createDepositRequest(user.uid, numericAmount, hash);
      try {
        await sendEmail('deposit_request', {
          to: user.email,
          name: user.displayName,
          data: { amount: numericAmount, txHash: hash },
        });
      } catch (emailErr) {
        console.warn('Email dispatch failed:', emailErr);
      }

      toast.success('USDT Payment complete! Tracking transaction confirmations.', { id: toastId });
      checkDepositStatus(hash, hash);
    } catch (error: any) {
      console.error('Web3 payment error:', error);
      toast.error(error.message || 'Web3 transaction failed or cancelled.', { id: toastId });
    } finally {
      setWeb3Loading(false);
    }
  };

  const copyAddress = async () => {
    if (!depositAddressReady) {
      toast.error('Deposit address is not configured yet.');
      return;
    }
    await navigator.clipboard.writeText(USDT_BEP20_ADDRESS);
    toast.success('Deposit address copied.');
  };

  const checkDepositStatus = async (depositId: string, hash?: string) => {
    if (!hash) return toast.error('No transaction hash found.');
    if (!depositAddressReady) return toast.error('Deposit address is not configured yet.');
    setCheckingTx(depositId);
    try {
      const params = new URLSearchParams({ txHash: hash, to: USDT_BEP20_ADDRESS });
      const response = await fetch(`/api/deposit-status?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Check failed.');
      setTxStatuses((prev) => ({ ...prev, [depositId]: data }));
    } catch (error: any) {
      toast.error(error.message || 'Deposit status check failed.');
    } finally {
      setCheckingTx(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
          New Investment
        </h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Deposit USDT to start earning daily profit. Minimum $50.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Calculator Slider & Presets */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
            <h2 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-50 mb-6 flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-brand-gold" />
              Choose Amount
            </h2>

            {/* Slider container */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Select Amount
                </span>
                <span className="font-mono text-2xl font-extrabold text-brand-gold-dark dark:text-brand-gold">
                  ${numericAmount.toLocaleString()} <span className="text-xs text-neutral-400 font-sans">USDT</span>
                </span>
              </div>

              {/* Range Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="50"
                  max="10000"
                  step="50"
                  value={numericAmount || 50}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-2 bg-neutral-100 dark:bg-neutral-950 rounded-lg appearance-none cursor-pointer accent-brand-gold border border-neutral-200/50 dark:border-neutral-800/40 focus:outline-none"
                />
                <div className="flex justify-between text-[9px] text-neutral-400 font-mono font-bold uppercase tracking-wider">
                  <span>$50</span>
                  <span>$2,500</span>
                  <span>$5,000</span>
                  <span>$10,000</span>
                </div>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {INVESTMENT_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                      numericAmount === preset 
                        ? 'bg-brand-gold/10 border-brand-gold text-brand-gold-dark dark:text-brand-gold shadow-sm' 
                        : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200/60 dark:border-neutral-800/60 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>

              {/* Manual Input input-gold replacement */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-brand-gold font-mono text-lg font-bold">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={MIN_INVESTMENT}
                  step={MIN_INVESTMENT}
                  className={`w-full bg-neutral-50 dark:bg-neutral-950 border ${
                    isInvalid 
                      ? 'border-red-500 focus:border-red-500' 
                      : 'border-neutral-200 dark:border-neutral-800 focus:border-brand-gold'
                  } rounded-2xl py-4 pl-10 pr-4 text-neutral-900 dark:text-neutral-50 font-mono text-lg focus:outline-none transition-colors shadow-inner`}
                  placeholder="50"
                />
                {isInvalid && (
                  <p className="text-red-500 text-[10px] mt-2 font-semibold">
                    Allocation must be $50 or a multiple of $50.
                  </p>
                )}
              </div>
            </div>

            {/* Plan tier details summary card */}
            <div className="mt-6 rounded-2xl border border-neutral-200/60 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/20 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Plan</span>
                <Badge variant="gold" text={`${planName} Tier`} className="font-bold py-0.5 px-2.5" />
              </div>
              
              <div className="border-t border-neutral-200/40 dark:border-neutral-800/40 my-3" />
              
              <div className="grid grid-cols-2 gap-y-3.5 text-xs">
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Daily Rate</span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200 mt-1 font-bold">
                    {(currentTier.dailyRateMin * 100).toFixed(1)}% - {(currentTier.dailyRateMax * 100).toFixed(1)}% Daily
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider font-semibold">Estimated Daily Profit</span>
                  <span className="font-mono text-emerald-500 mt-1 font-bold">
                    ${minDailyProfit.toFixed(2)} - ${maxDailyProfit.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Withdrawal Rule</span>
                  <span className="text-neutral-800 dark:text-neutral-200 mt-1 font-bold">
                    Minimum withdrawal is $50 profit
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider font-semibold">Your Deposit</span>
                  <span className="text-neutral-800 dark:text-neutral-200 mt-1 font-bold">
                    Stays locked while earning
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* ACTIVE INVESTMENTS LIST */}
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-gold" />
                Active Investments
              </h2>
            </div>

            {investments.length === 0 ? (
              <div className="border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <Coins className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">No Investments Yet</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
                  Submit a deposit on the right. Once verified, your investment will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {investments.map((investment) => {
                  const tier = getTierForAmount(investment.amount);
                  const isSettleDisabled = Number(investment.profitAvailable || 0) < 50;
                  return (
                    <div 
                      key={investment.id}
                      className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-3.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{tier.name}</h4>
                          <span className="text-[9px] text-neutral-400 font-mono mt-0.5 block">ID: {investment.id.substring(0, 10)}...</span>
                        </div>
                        <Badge 
                          variant={investment.status === 'active' ? 'success' : 'gold'} 
                          text={investment.status.toUpperCase().replace(/_/g, ' ')} 
                          className="text-[9px] py-0 px-2 font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-neutral-200/20 dark:border-neutral-800/20">
                        <div>
                          <span className="text-[9px] uppercase text-neutral-400 tracking-wider block font-semibold">Principal</span>
                          <span className="text-xs font-bold font-mono text-neutral-800 dark:text-neutral-200">${Number(investment.amount || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-neutral-400 tracking-wider block font-semibold">Rate</span>
                          <span className="text-xs font-bold font-mono text-brand-gold">{(investment.dailyRateMin * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase text-neutral-400 tracking-wider block font-semibold">Profit</span>
                          <span className="text-xs font-bold font-mono text-emerald-500">${Number(investment.profitAvailable || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-[9px] text-neutral-400 font-medium mb-1">
                            <span>Settle Target</span>
                            <span className={isSettleDisabled ? 'text-amber-500' : 'text-emerald-500'}>
                              {isSettleDisabled ? `$${Number(investment.profitAvailable || 0).toFixed(0)}/$50` : 'Ready'}
                            </span>
                          </div>
                          <ProgressBar value={Math.min(100, (Number(investment.profitAvailable || 0) / 50) * 100)} className="h-1" />
                        </div>

                        {investment.status === 'active' && (
                          <Button
                            onClick={() => setSettlingInvestment(investment)}
                            className="bg-transparent border border-brand-gold/30 hover:bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold text-[10px] font-bold py-1 px-3.5 rounded-xl h-8 shrink-0 flex items-center justify-center transition-colors"
                          >
                            Settle
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Checkout Payment Panel */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <Card className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm relative overflow-hidden">
            
            {/* Background design vector */}
            <div className="absolute right-[-40px] bottom-[-40px] w-48 h-48 pointer-events-none z-0 opacity-5">
              <Coins className="w-full h-full text-brand-gold animate-spin" style={{ animationDuration: '60s' }} />
            </div>

            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-brand-gold" />
                  Send Payment
                </h2>
                <p className="text-[11px] text-neutral-400 leading-normal mt-0.5">
                  Confirm your deposit of <span className="font-mono text-brand-gold font-bold">${numericAmount}</span>.
                </p>
              </div>

              {!depositAddressReady && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 flex gap-3">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Deposit address is being configured. Do not send funds until support confirms the live BEP20 address.</span>
                </div>
              )}

              {/* Selector Tabs */}
              <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl">
                <button
                  onClick={() => setDepositMode('web3')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    depositMode === 'web3' 
                      ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-sm' 
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-transparent'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Pay with Wallet</span>
                </button>
                <button
                  onClick={() => setDepositMode('manual')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    depositMode === 'manual' 
                      ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-sm' 
                      : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-transparent'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Manual Transfer</span>
                </button>
              </div>

              {/* Deposit Mode: Web3 Checkout */}
              {depositMode === 'web3' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-950/20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20 text-brand-gold">
                        <Wallet className="w-5 h-5 animate-pulse" />
                      </div>
                      
                      {connectedWallet ? (
                        <div className="space-y-1">
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Connected Account</p>
                          <p className="text-xs font-mono font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 rounded-xl">
                            {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-6)}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[11px] text-neutral-400 leading-normal max-w-[240px]">
                            Connect MetaMask, Trust Wallet, or any BSC BEP20 compatible browser wallet.
                          </p>
                          <button
                            onClick={connectWallet}
                            className="bg-transparent border border-brand-gold/30 hover:bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold font-bold px-4 py-1.5 text-xs rounded-xl transition-all"
                          >
                            Connect Wallet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold h-12 rounded-2xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-brand-gold/15"
                    disabled={isInvalid || web3Loading || !depositAddressReady} 
                    onClick={payWithWeb3}
                  >
                    <span>{!depositAddressReady ? 'Deposit Address Pending' : web3Loading ? 'Waiting for Wallet Signature...' : 'Approve & Deposit'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                /* Deposit Mode: Manual Ledger */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-2 text-xs">
                    <p className="font-bold text-brand-gold-dark dark:text-brand-gold">How to Deposit</p>
                    <ol className="list-decimal space-y-1.5 pl-4 text-neutral-500 dark:text-neutral-400 font-medium">
                      <li>Send exactly <span className="font-bold font-mono text-neutral-800 dark:text-neutral-200">${numericAmount.toFixed(2)} USDT</span> on the BSC (BEP20) network.</li>
                      <li>Copy the transaction hash from your wallet, swap app, or exchange explorer.</li>
                      <li>Paste the hash below and submit for admin checking.</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">USDT BEP20 Recipient Address</label>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 font-mono text-xs text-brand-gold-dark dark:text-brand-gold break-all select-all shadow-inner">
                        {USDT_BEP20_ADDRESS_DISPLAY}
                      </div>
                      <button 
                        onClick={copyAddress} 
                        disabled={!depositAddressReady}
                        className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-950 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Copy className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">
                      BSC Transaction Hash (TXID)
                    </label>
                    <input
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className={`w-full bg-neutral-50 dark:bg-neutral-950 border ${
                        txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash.trim()) 
                          ? 'border-red-500 focus:border-red-500' 
                          : 'border-neutral-200 dark:border-neutral-800 focus:border-brand-gold'
                      } rounded-2xl py-3 px-4 text-xs font-mono focus:outline-none transition-colors shadow-inner`}
                      placeholder="Paste 64-char transaction hash starting with 0x"
                      required
                    />
                    {txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash.trim()) && (
                      <p className="text-red-500 text-[9px] font-bold">Must be a 64-character hexadecimal transaction hash.</p>
                    )}
                  </div>

                  <Button 
                    className="w-full bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold h-12 rounded-2xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-brand-gold/15"
                    disabled={isInvalid || submitting || !txHash || !depositAddressReady} 
                    onClick={submitDeposit}
                  >
                    <span>{!depositAddressReady ? 'Deposit Address Pending' : submitting ? 'Registering Ledger...' : 'Submit Deposit Proof'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* INVESTMENT HISTORY LEDGER TABLE */}
      <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden mt-2">
        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/40 flex justify-between items-center bg-neutral-50/20">
          <h2 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-gold" />
            Deposit History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] uppercase tracking-wider text-neutral-400 bg-neutral-50/50 dark:bg-neutral-950/20 font-sans border-b border-neutral-200/40 dark:border-neutral-800/40">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Tier Category</th>
                <th className="px-6 py-4 font-semibold">Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">On-Chain Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="w-6 h-6 text-neutral-300 dark:text-neutral-800 mb-1" />
                      <p className="text-xs">No deposits found</p>
                    </div>
                  </td>
                </tr>
              ) : deposits.map((deposit) => {
                const tierName = getTierForAmount(Number(deposit.amount || 0)).name;
                return (
                  <tr key={deposit.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-950/10 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      {deposit.createdAt?.toDate ? deposit.createdAt.toDate().toLocaleDateString() : 'Pending'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      ${Number(deposit.amount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-600 dark:text-neutral-400">
                      {tierName} Plan
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      USDT BEP20
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <Badge 
                          variant={
                            deposit.status === 'verified'
                              ? 'success'
                              : deposit.status === 'rejected'
                              ? 'error'
                              : 'warning'
                          } 
                          text={deposit.status.toUpperCase()} 
                          className="text-[9px] py-0 px-2 font-bold"
                        />
                        {deposit.status === 'rejected' && (
                          <div className="text-[10px] text-red-500 max-w-[200px] leading-relaxed">
                            <span className="font-bold">Reason:</span> {deposit.rejectionReason || 'TX Hash is invalid or already claimed.'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col gap-1 items-end">
                        <button 
                          onClick={() => checkDepositStatus(deposit.id, deposit.txHash)} 
                          className="bg-transparent border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-950 font-bold px-3 py-1 text-[10px] rounded-xl flex items-center justify-center transition-colors h-7"
                          disabled={checkingTx === deposit.id || !deposit.txHash}
                        >
                          {checkingTx === deposit.id ? 'Scanning Node...' : 'Verify Status'}
                        </button>
                        
                        {txStatuses[deposit.id] && (
                          <div className="space-y-1 text-right mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold font-sans ${
                              txStatuses[deposit.id].status === 'confirmed' 
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                : txStatuses[deposit.id].status === 'confirming' 
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse' 
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {txStatuses[deposit.id].status === 'confirmed' && 'Confirmed'}
                              {txStatuses[deposit.id].status === 'confirming' && `Confirming (${txStatuses[deposit.id].confirmations}/${txStatuses[deposit.id].targetConfirmations})`}
                              {txStatuses[deposit.id].status === 'failed' && 'Failed'}
                              {txStatuses[deposit.id].status === 'pending_or_not_found' && 'Not Found'}
                            </span>
                            
                            {deposit.txHash && (
                              <a 
                                href={`https://bscscan.com/tx/${deposit.txHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block text-[9px] text-brand-gold-dark dark:text-brand-gold hover:underline font-mono"
                              >
                                BscScan ↗
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* PORTFOLIO SETTLEMENT MODAL */}
      <AnimatePresence>
        {settlingInvestment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
            >
              <h3 className="text-base font-bold font-display text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Settle Investment Portfolio
              </h3>
              
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Settle this portfolio to stop yield generation and withdraw its accumulated profit. 
                <span className="text-brand-gold font-semibold block mt-1.5">
                  Note: The principal investment of ${Number(settlingInvestment.amount).toFixed(2)} is non-refundable and will remain active/consumed by the platform. Only the profit will be sent.
                </span>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1">Select Approved Wallet</label>
                  <select
                    value={settleWalletAddress}
                    onChange={(e) => setSettleWalletAddress(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-neutral-800 dark:text-neutral-200"
                    required
                  >
                    <option value="">Select approved BEP20 wallet</option>
                    {approvedWallets.map((wallet) => (
                      <option key={wallet.id} value={wallet.address}>
                        {wallet.label || 'BEP20 Wallet'} - {wallet.address.slice(0, 12)}...
                      </option>
                    ))}
                  </select>
                  {approvedWallets.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1 font-semibold">Please whitelist a wallet in Profile settings first.</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">Select Settlement Speed</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettleSpeed('standard')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        settleSpeed === 'standard'
                          ? 'border-brand-gold bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 text-neutral-400'
                      }`}
                    >
                      <span className="text-xs font-bold">Standard</span>
                      <span className="text-[9px] text-neutral-400 mt-1.5">24-48 Hours (8% Fee)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleSpeed('express')}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        settleSpeed === 'express'
                          ? 'border-brand-gold bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/20 text-neutral-400'
                      }`}
                    >
                      <span className="text-xs font-bold">Express</span>
                      <span className="text-[9px] text-neutral-400 mt-1.5">Under 1 Hour (12% Fee)</span>
                    </button>
                  </div>
                </div>

                {/* Calculations */}
                <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-semibold">Accumulated Profit</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">${Number(settlingInvestment.profitAvailable).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-semibold">Processing Fee ({settleSpeed === 'express' ? '12%' : '8%'})</span>
                    <span className="font-mono text-red-500 font-bold">
                      -${(Number(settlingInvestment.profitAvailable) * (settleSpeed === 'express' ? 0.12 : 0.08)).toFixed(2)}
                    </span>
                  </div>
                  <hr className="border-neutral-200/60 dark:border-neutral-800/60 my-1" />
                  <div className="flex justify-between text-sm font-extrabold">
                    <span className="text-brand-gold-dark dark:text-brand-gold">Net Return</span>
                    <span className="font-mono text-brand-gold-dark dark:text-brand-gold">
                      ${(
                        Number(settlingInvestment.profitAvailable) -
                        Number(settlingInvestment.profitAvailable) * (settleSpeed === 'express' ? 0.12 : 0.08)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setSettlingInvestment(null)}
                  className="flex-1 bg-transparent border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-950 text-neutral-700 dark:text-neutral-200 text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  disabled={settlingSubmit || !settleWalletAddress || Number(settlingInvestment.profitAvailable) < 50}
                  onClick={async () => {
                    if (!user || !settlingInvestment) return;
                    setSettlingSubmit(true);
                    try {
                      const profit = Number(settlingInvestment.profitAvailable);
                      const fee = profit * (settleSpeed === 'express' ? 0.12 : 0.08);
                      await settleAndWithdrawProfit(
                        user.uid,
                        settlingInvestment.id,
                        settleWalletAddress,
                        settleSpeed,
                        fee
                      );
                      toast.success('Settlement request submitted successfully!');
                      setSettlingInvestment(null);
                    } catch (err: any) {
                      toast.error(err.message || 'Settlement failed.');
                    } finally {
                      setSettlingSubmit(false);
                    }
                  }}
                  className="bg-[#D4AF37] hover:bg-brand-gold-light text-neutral-950 font-extrabold flex-1 text-xs rounded-xl"
                >
                  {settlingSubmit ? 'Settling...' : 'Confirm Settle'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
