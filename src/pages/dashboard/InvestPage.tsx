import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { CircleDollarSign, ArrowRight, Wallet, History, Download, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import {
  MAX_DAILY_RATE,
  MIN_DAILY_RATE,
  MIN_INVESTMENT,
  USDT_BEP20_ADDRESS,
  createDepositRequest,
  useDashboardData,
} from '@/lib/dashboardData';

const INVESTMENT_AMOUNTS = [50, 100, 150, 200, 250, 500, 1000];

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

  const numericAmount = parseFloat(amount) || 0;
  const isInvalid = numericAmount < MIN_INVESTMENT || numericAmount % MIN_INVESTMENT !== 0;
  const planName = numericAmount >= 5000 ? 'Elite' : numericAmount >= 500 ? 'Growth' : 'Starter';
  const minDailyProfit = numericAmount * MIN_DAILY_RATE;
  const maxDailyProfit = numericAmount * MAX_DAILY_RATE;

  const submitDeposit = async () => {
    if (!user || isInvalid) return;

    const cleanHash = txHash.trim();
    if (!cleanHash) {
      toast.error('Transaction Hash is required as proof of deposit.');
      return;
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(cleanHash)) {
      toast.error('Please enter a valid BEP20 (BSC) Transaction Hash (64-character hex starting with 0x).');
      return;
    }

    setSubmitting(true);
    try {
      await createDepositRequest(user.uid, numericAmount, cleanHash);
      await sendEmail('deposit_request', {
        to: user.email,
        name: user.displayName,
        data: { amount: numericAmount, txHash: cleanHash },
      });
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
      toast.error('No Web3 wallet (like MetaMask or Trust Wallet) was detected. Please open this page in a Web3-compatible browser.');
      return;
    }
    try {
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts?.[0]) {
        setConnectedWallet(accounts[0]);
        toast.success('Wallet connected successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Could not connect Web3 wallet.');
    }
  };

  const payWithWeb3 = async () => {
    if (!user || isInvalid) return;
    if (typeof (window as any).ethereum === 'undefined') {
      toast.error('No Web3 wallet detected. Please connect MetaMask or Trust Wallet.');
      return;
    }

    setWeb3Loading(true);
    const toastId = toast.loading('Initiating Web3 Payment...');
    try {
      // 1. Connect Accounts
      const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];
      setConnectedWallet(walletAddress);

      // 2. Switch network to BSC (0x38 = 56)
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

      // 3. Encode USDT transfer transfer(address recipient, uint256 amount)
      // USDT Contract on BSC: 0x55d398326f99059ff775485246999027b3197955
      const USDT_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
      const methodId = 'a9059cbb';
      const cleanDest = USDT_BEP20_ADDRESS.startsWith('0x') ? USDT_BEP20_ADDRESS.slice(2) : USDT_BEP20_ADDRESS;
      const paddedDest = cleanDest.padStart(64, '0').toLowerCase();
      const amountInWei = BigInt(numericAmount) * BigInt(10 ** 18);
      const paddedAmount = amountInWei.toString(16).padStart(64, '0').toLowerCase();
      const transferData = '0x' + methodId + paddedDest + paddedAmount;

      toast.loading('Confirming transaction in wallet...', { id: toastId });

      // 4. Trigger wallet popup
      const hash = await (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: USDT_CONTRACT,
          data: transferData,
        }]
      });

      toast.loading('Transaction submitted! Registering in database...', { id: toastId });

      // 5. Create deposit request record
      await createDepositRequest(user.uid, numericAmount, hash);
      await sendEmail('deposit_request', {
        to: user.email,
        name: user.displayName,
        data: { amount: numericAmount, txHash: hash },
      });

      toast.success('USDT Payment complete! Tracking transaction confirmations.', { id: toastId });
      
      // Auto trigger tracker
      checkDepositStatus(hash, hash);
    } catch (error: any) {
      console.error('Web3 payment error:', error);
      toast.error(error.message || 'Web3 transaction failed or cancelled.', { id: toastId });
    } finally {
      setWeb3Loading(false);
    }
  };

  const copyAddress = async () => {
    await navigator.clipboard.writeText(USDT_BEP20_ADDRESS);
    toast.success('USDT BEP20 address copied.');
  };

  const checkDepositStatus = async (depositId: string, hash?: string) => {
    if (!hash) return toast.error('No transaction hash on this deposit.');
    setCheckingTx(depositId);
    try {
      const params = new URLSearchParams({ txHash: hash, to: USDT_BEP20_ADDRESS });
      const response = await fetch(`/api/deposit-status?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not check transaction.');
      setTxStatuses((prev) => ({ ...prev, [depositId]: data }));
    } catch (error: any) {
      toast.error(error.message || 'Deposit tracker unavailable.');
    } finally {
      setCheckingTx(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-medium text-white">Invest</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <GlassCard className="p-8 sticky top-28 relative overflow-hidden">
            {/* Elegant Background Watermark Image for the entire New Investment card */}
            <div className="absolute right-[-80px] bottom-[-40px] w-[500px] h-[500px] pointer-events-none z-0 opacity-[0.12] mix-blend-screen select-none">
              <img src={`/images/${planName}.png`} alt="" className="w-full h-full object-contain" />
            </div>

            {/* Foreground Content wrapper to ensure z-index separation */}
            <div className="relative z-10">
              <h2 className="text-xl font-medium text-white mb-6 flex items-center gap-2">
                <CircleDollarSign className="w-5 h-5 text-gold-500" />
                New Investment
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Investment Amount (USD)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {INVESTMENT_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        className={`rounded-lg border px-3 py-2 text-sm font-mono transition-colors ${numericAmount === preset ? 'bg-gold-500/10 border-gold-500 text-gold-500' : 'bg-dark-900/50 border-gold-500/10 text-text-secondary hover:text-white'}`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gold-500 font-mono text-xl">$</span>
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={MIN_INVESTMENT}
                      step={MIN_INVESTMENT}
                      className={`w-full bg-dark-900 border ${isInvalid ? 'border-danger' : 'border-gold-500/20 focus:border-gold-500'} rounded-xl py-4 pl-10 pr-4 text-white font-mono text-xl focus:outline-none transition-colors`}
                      placeholder="50"
                    />
                  </div>
                  {isInvalid && <p className="text-danger text-xs mt-2">Investment must be $50, $100, or any $50 multiple.</p>}
                </div>

                <div className="bg-dark-900/50 rounded-xl p-4 border border-gold-500/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">Selected Plan</span>
                    <span className="text-sm font-medium text-gold-500 px-2 py-0.5 bg-gold-500/10 rounded-md">{planName}</span>
                  </div>
                  <div className="border-t border-gold-500/10 my-3" />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Locked Principal</span>
                      <span className="text-sm font-mono text-white">${numericAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Daily Profit</span>
                      <span className="text-sm font-mono text-profit-green">0.5% - 1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Projected Daily Profit</span>
                      <span className="text-sm font-mono text-profit-green">${minDailyProfit.toFixed(2)} - ${maxDailyProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-secondary">Profit Withdrawal</span>
                      <span className="text-sm text-text-muted">Min $50 profit</span>
                    </div>
                  </div>
                </div>

                {/* Deposit Mode Selector */}
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">Deposit Method</label>
                  <div className="flex gap-2 p-1 bg-dark-950/80 border border-gold-500/10 rounded-xl mb-4">
                    <button 
                      type="button"
                      onClick={() => setDepositMode('web3')}
                      className={`flex-1 py-3 text-[12px] font-sans font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${depositMode === 'web3' ? 'bg-gold-500 text-dark-900 shadow-[0_2px_8px_rgba(212,175,55,0.3)]' : 'text-[#E8E4D4]/40 hover:text-white bg-transparent'}`}
                    >
                      <Wallet className="w-4 h-4" /> Web3 Direct Pay
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDepositMode('manual')}
                      className={`flex-1 py-3 text-[12px] font-sans font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${depositMode === 'manual' ? 'bg-gold-500 text-dark-900 shadow-[0_2px_8px_rgba(212,175,55,0.3)]' : 'text-[#E8E4D4]/40 hover:text-white bg-transparent'}`}
                    >
                      <History className="w-4 h-4" /> Manual CEX Transfer
                    </button>
                  </div>
                </div>

                {depositMode === 'web3' ? (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gold-500/10 bg-dark-900/40 p-5 text-center relative overflow-hidden">
                      <div className="relative z-10 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20 text-gold-500">
                          <Wallet className="w-6 h-6 animate-pulse" />
                        </div>
                        {connectedWallet ? (
                          <div className="space-y-1">
                            <p className="text-xs text-text-muted">Connected Wallet</p>
                            <p className="text-sm font-mono text-white">{connectedWallet.slice(0, 8)}...{connectedWallet.slice(-6)}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-text-muted">Connect your Web3 Wallet (MetaMask, Trust Wallet, etc.) for instant automated deposits.</p>
                            <button
                              type="button"
                              onClick={connectWallet}
                              className="btn-ghost text-xs px-4 py-2 border border-gold-500/20 rounded-lg text-gold-500 hover:bg-gold-500/10"
                            >
                              Connect Wallet
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <GoldButton 
                      className="w-full h-14 text-base" 
                      disabled={isInvalid || web3Loading} 
                      onClick={payWithWeb3}
                    >
                      {web3Loading ? 'Paying via Wallet...' : 'Pay with Web3 Wallet'} <ArrowRight className="w-5 h-5 ml-1" />
                    </GoldButton>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-dark-900/50 rounded-xl p-4 border border-gold-500/10">
                      <p className="text-sm font-medium text-gold-500">USDT (BEP20)</p>
                      <p className="text-xs text-text-muted mt-1">Send funds from your exchange (Binance, OKX, Bybit) or custom wallet to this address.</p>
                    </div>

                    <div>
                      <label className="block text-sm text-text-secondary mb-2">Deposit Address</label>
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-xl border border-gold-500/20 bg-dark-900 px-4 py-3 font-mono text-xs text-gold-500 break-all">
                          {USDT_BEP20_ADDRESS}
                        </div>
                        <button type="button" onClick={copyAddress} className="btn-ghost px-4 rounded-xl">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white font-medium mb-2">
                        Transaction Hash <span className="text-danger">*</span>
                      </label>
                      <input
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        className={`input-gold font-mono text-sm ${txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash.trim()) ? 'border-danger focus:border-danger' : ''}`}
                        placeholder="Paste BEP20 tx hash starting with 0x"
                        required
                      />
                      {txHash && !/^0x[a-fA-F0-9]{64}$/.test(txHash.trim()) && (
                        <p className="text-danger text-[10px] mt-1">Must be a 64-character hex starting with 0x.</p>
                      )}
                    </div>

                    <GoldButton className="w-full h-14 text-base" disabled={isInvalid || submitting} onClick={submitDeposit}>
                      {submitting ? 'Saving Request...' : 'Confirm Manual Transfer'} <ArrowRight className="w-5 h-5 ml-1" />
                    </GoldButton>
                  </div>
                )}
                <p className="text-xs text-text-muted text-center">Principal is non-refundable. Profit starts generating from $0 after verification, and can be withdrawn indefinitely once it reaches $50.</p>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-8">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-6 border-b border-gold-500/10 flex justify-between items-center">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gold-500" />
                Active Portfolios
              </h2>
            </div>
            <div className="p-6">
              {investments.length === 0 ? (
                <div className="rounded-xl border border-gold-500/10 bg-dark-900/40 p-8 text-center text-text-muted relative overflow-hidden min-h-[160px] flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                    <img src="/images/Empty Investments.png" alt="No Investments" className="w-28 h-28 object-contain opacity-75 drop-shadow-[0_0_20px_rgba(212,175,55,0.25)]" />
                    <p>No live active portfolios. Verified investments will show locked principal, daily profit range, and withdrawal status here.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto w-full border border-gold-500/10 rounded-xl bg-dark-900/20">
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
                      {investments.map((investment) => (
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
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-0 overflow-hidden flex-1">
            <div className="p-6 border-b border-gold-500/10 flex justify-between items-center bg-dark-900/20">
              <h2 className="text-xl font-medium text-white flex items-center gap-2">
                <History className="w-5 h-5 text-gold-500" />
                Investment History
              </h2>
              <button className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-white transition-colors">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-muted uppercase bg-dark-900/50">
                  <tr>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Plan</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Profit Status</th>
                    <th className="px-6 py-4 font-medium">Tracker</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-muted relative overflow-hidden">
                        <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                          <img src="/images/Empty Transactions.png" alt="No Deposits" className="w-28 h-28 object-contain opacity-75 mb-2 drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" />
                          <p className="text-sm max-w-xs">No live investment history.</p>
                        </div>
                      </td>
                    </tr>
                  ) : deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-gold-500/10 hover:bg-dark-800/50 transition-colors">
                      <td className="px-6 py-4 text-text-secondary">{deposit.createdAt?.toDate ? deposit.createdAt.toDate().toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 font-mono text-white">${Number(deposit.amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-text-secondary">{Number(deposit.amount || 0) >= 5000 ? 'Elite' : Number(deposit.amount || 0) >= 500 ? 'Growth' : 'Starter'}</td>
                      <td className="px-6 py-4 text-text-secondary">USDT BEP20</td>
                       <td className="px-6 py-4">
                         <div>
                           <span className="badge badge-gold">{deposit.status}</span>
                           {deposit.status === 'rejected' && (
                             <div className="mt-2 text-[11px] text-[#EF4444] max-w-[220px] leading-relaxed">
                               <span className="font-semibold">Reason:</span> {deposit.rejectionReason || 'On-chain verification failed.'}
                               <div className="mt-1.5 font-medium text-gold-500 hover:text-gold-400">
                                 Please double check your Transaction Hash and submit a new deposit above, or contact our support team.
                               </div>
                             </div>
                           )}
                         </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <button 
                            type="button" 
                            onClick={() => checkDepositStatus(deposit.id, deposit.txHash)} 
                            className="btn-ghost h-8 px-3 text-xs rounded-lg border border-gold-500/10 hover:bg-gold-500/5 text-gold-500" 
                            disabled={checkingTx === deposit.id || !deposit.txHash}
                          >
                            {checkingTx === deposit.id ? 'Verifying...' : 'Verify On-Chain'}
                          </button>
                          
                          {txStatuses[deposit.id] && (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium font-sans ${
                                txStatuses[deposit.id].status === 'confirmed' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25' :
                                txStatuses[deposit.id].status === 'confirming' ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25 animate-pulse' :
                                txStatuses[deposit.id].status === 'failed' ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/25' :
                                'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/25'
                              }`}>
                                {txStatuses[deposit.id].status === 'confirmed' && '✅ BSC Confirmed'}
                                {txStatuses[deposit.id].status === 'confirming' && `⏳ Confirming (${txStatuses[deposit.id].confirmations}/${txStatuses[deposit.id].targetConfirmations})`}
                                {txStatuses[deposit.id].status === 'failed' && '❌ Failed/Reverted'}
                                {txStatuses[deposit.id].status === 'pending_or_not_found' && '🔍 Node Scanning'}
                              </span>
                              
                              {deposit.txHash && (
                                <a 
                                  href={`https://bscscan.com/tx/${deposit.txHash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="block text-[10px] text-gold-500/70 hover:text-gold-500 hover:underline font-mono"
                                >
                                  View Explorer ↗
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
