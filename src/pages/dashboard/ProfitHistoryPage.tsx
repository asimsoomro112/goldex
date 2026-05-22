import React, { useState } from 'react';
import { Download, History, BarChart3, Receipt, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { downloadCsv, useDashboardData, useLedgerEntries } from '@/lib/dashboardData';
import { Card, Badge, Button } from '@/components/ui';

export function ProfitHistoryPage() {
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const { user } = useAuth();
  const { deposits, investments, totals, withdrawals } = useDashboardData(user?.uid);
  const { entries: ledgerEntries } = useLedgerEntries(user?.uid, 100);

  const transactions = [
    ...deposits.map((deposit) => ({
      id: `deposit-${deposit.id}`,
      date: deposit.createdAt?.toDate ? deposit.createdAt.toDate().toLocaleDateString() : '-',
      type: 'deposit' as const,
      amount: deposit.amount,
      ref: 'USDT BEP20 Deposit',
      status: deposit.status,
    })),
    ...withdrawals.map((withdrawal) => ({
      id: `withdrawal-${withdrawal.id}`,
      date: withdrawal.createdAt?.toDate ? withdrawal.createdAt.toDate().toLocaleDateString() : '-',
      type: 'withdrawal' as const,
      amount: -withdrawal.amount,
      ref: withdrawal.type === 'settlement' ? 'Portfolio Settlement' : 'USDT BEP20 Withdrawal',
      status: withdrawal.status,
    })),
  ].filter((item) => filterType === 'all' || item.type === filterType);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-6">
      
      {/* Title & Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 font-display">
            Profit Analytics & Ledger
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Export transaction histories and view audit logs of the ledger.
          </p>
        </div>
        
        <Button 
          variant="secondary" 
          className="h-10 text-xs font-bold py-0 w-max border-neutral-200 dark:border-neutral-800 text-neutral-850 dark:text-neutral-200 flex items-center gap-1.5 self-start sm:self-auto hover:bg-neutral-50 dark:hover:bg-neutral-900" 
          onClick={() => downloadCsv('goldex-transactions.csv', transactions)}
        >
          <Download className="w-4 h-4" /> 
          <span>Download Report</span>
        </Button>
      </div>

      {/* Analytics Mini Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Profit Card */}
        <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-brand-gold shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Today's Profit yield</span>
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-50 block mt-0.5">${totals.todayProfit.toFixed(2)}</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">Real-time daily accrual</span>
          </div>
        </Card>

        {/* Cumulative Earnings */}
        <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Cumulative Earnings</span>
            <span className="text-xl font-bold font-mono text-emerald-500 block mt-0.5">${totals.totalEarned.toFixed(2)}</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">Life-time profit generated</span>
          </div>
        </Card>

        {/* active contracts */}
        <Card className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-500 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block">Active Contracts</span>
            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-50 block mt-0.5">{investments.filter(i => i.status === 'active').length} Contracts</span>
            <span className="text-[9px] text-neutral-400 block mt-0.5">Yield-generating contracts</span>
          </div>
        </Card>
      </div>

      {/* TRANSACTION HISTORY SECTION */}
      <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50/20">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-gold" />
            <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-neutral-50">
              Transaction Log
            </h3>
          </div>
          
          {/* Tab filter toggles */}
          <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 border border-neutral-200/50 dark:border-neutral-800/40 rounded-xl">
            {(['all', 'deposit', 'withdrawal'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all ${
                  filterType === tab
                    ? 'bg-white dark:bg-neutral-900 text-neutral-950 dark:text-neutral-50 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 bg-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50/50 dark:bg-neutral-950/20 font-sans text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200/40 dark:border-neutral-800/40">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 text-xs">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="w-6 h-6 text-neutral-300 dark:text-neutral-800 mb-1" />
                      <p>No historical transactions matching selection</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const isDeposit = transaction.type === 'deposit';
                  return (
                    <tr key={transaction.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-950/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-neutral-500 dark:text-neutral-400">
                        {transaction.date}
                      </td>
                      <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                        <div className="flex items-center gap-1.5">
                          {isDeposit ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span>{transaction.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 dark:text-neutral-450 font-medium">
                        {transaction.ref}
                      </td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={
                            transaction.status === 'verified' || transaction.status === 'paid'
                              ? 'success'
                              : transaction.status === 'rejected'
                              ? 'error'
                              : 'warning'
                          } 
                          text={transaction.status.toUpperCase()} 
                          className="text-[9px] py-0 px-2 font-bold"
                        />
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-bold ${isDeposit ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isDeposit ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* IMMUTABLE AUDIT LEDGER SECTION */}
      <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden mt-2">
        <div className="p-6 border-b border-neutral-200/50 dark:border-neutral-800/40 bg-neutral-50/20">
          <h3 className="font-display text-sm font-bold text-neutral-900 dark:text-neutral-50">
            Immutable Audit Ledger History
          </h3>
          <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
            Append-only records of yield logs, transactions, whitelists, and compliance actions synced with the blockchain.
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-50/50 dark:bg-neutral-950/20 font-sans text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200/40 dark:border-neutral-800/40">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Ledger Event</th>
                <th className="px-6 py-4 font-semibold">Reference Path</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/40 text-xs">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-6 h-6 text-neutral-300 dark:text-neutral-800 mb-1" />
                      <p>No audit logs available for this account</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-50/40 dark:hover:bg-neutral-950/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-neutral-500 dark:text-neutral-400">
                      {entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : 'Pending'}
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                      {entry.type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-neutral-400 max-w-[200px] truncate">
                      {entry.refPath || entry.refId || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={
                          entry.status === 'completed' || entry.status === 'verified' || entry.status === 'approved' || entry.status === 'active' || entry.status === 'paid'
                            ? 'success'
                            : entry.status === 'rejected'
                            ? 'error'
                            : 'warning'
                        } 
                        text={(entry.status || 'PENDING').toUpperCase()} 
                        className="text-[9px] py-0 px-2 font-bold"
                      />
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {typeof entry.amount === 'number' ? `$${entry.amount.toFixed(2)}` : '-'}
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
