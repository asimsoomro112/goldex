import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GoldButton } from '@/components/ui/GoldButton';
import { Download } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { downloadCsv, useDashboardData, useLedgerEntries } from '@/lib/dashboardData';

export function ProfitHistoryPage() {
  const [filterType, setFilterType] = useState('all');
  const { user } = useAuth();
  const { deposits, investments, totals, withdrawals } = useDashboardData(user?.uid);
  const { entries: ledgerEntries } = useLedgerEntries(user?.uid, 100);
  const transactions = [
    ...deposits.map((deposit) => ({
      id: `deposit-${deposit.id}`,
      date: deposit.createdAt?.toDate ? deposit.createdAt.toDate().toLocaleDateString() : '-',
      type: 'deposit',
      amount: deposit.amount,
      ref: 'USDT BEP20',
      status: deposit.status,
    })),
    ...withdrawals.map((withdrawal) => ({
      id: `withdrawal-${withdrawal.id}`,
      date: withdrawal.createdAt?.toDate ? withdrawal.createdAt.toDate().toLocaleDateString() : '-',
      type: 'withdrawal',
      amount: -withdrawal.amount,
      ref: 'USDT BEP20',
      status: withdrawal.status,
    })),
  ].filter((item) => filterType === 'all' || item.type === filterType);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-medium text-white">Profit Analytics</h1>
        <GoldButton variant="ghost" className="h-10 text-sm py-0 w-max" onClick={() => downloadCsv('goldex-transactions.csv', transactions)}>
          <Download className="w-4 h-4 mr-2" /> Download Report
        </GoldButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['Daily Profits (30 Days)', 'Cumulative Earnings', 'Profit Breakdown'].map((title) => (
          <GlassCard key={title} className="p-6">
            <h3 className="text-sm text-text-secondary font-medium uppercase tracking-wider mb-6">{title}</h3>
            <div className="h-[200px] rounded-xl border border-gold-500/10 bg-dark-900/40 flex items-center justify-center text-center px-6">
              <p className="text-sm text-text-muted">
                {title === 'Daily Profits (30 Days)' && `Today: $${totals.todayProfit.toFixed(2)}`}
                {title === 'Cumulative Earnings' && `Total earned: $${totals.totalEarned.toFixed(2)}`}
                {title === 'Profit Breakdown' && `${investments.length} investment record(s)`}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gold-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-medium text-white">Transaction History</h3>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['all', 'deposit', 'withdrawal'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${filterType === f ? 'bg-gold-500/20 text-gold-500' : 'bg-dark-900 border border-gold-500/10 text-text-secondary hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-dark-900/50">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No live transactions found.</td>
                </tr>
              ) : transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gold-500/10 hover:bg-dark-800/50 transition-colors">
                  <td className="px-6 py-4 text-text-secondary">{transaction.date}</td>
                  <td className="px-6 py-4 text-white font-medium capitalize">{transaction.type}</td>
                  <td className={`px-6 py-4 font-mono text-right ${transaction.amount >= 0 ? 'text-profit-green' : 'text-danger'}`}>{transaction.amount >= 0 ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}</td>
                  <td className="px-6 py-4 text-text-secondary">{transaction.ref}</td>
                  <td className="px-6 py-4 text-right"><span className="badge badge-gold">{transaction.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gold-500/10">
          <h3 className="text-lg font-medium text-white">Immutable Ledger History</h3>
          <p className="text-xs text-text-muted mt-1">Append-only records for deposits, withdrawals, KYC, wallet requests, and admin actions.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-muted uppercase bg-dark-900/50">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Reference</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-text-muted">No ledger entries yet.</td></tr>
              ) : ledgerEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-gold-500/10">
                  <td className="px-6 py-4 text-text-secondary">{entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 text-white">{entry.type.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 font-mono text-gold-500">{typeof entry.amount === 'number' ? `$${entry.amount.toFixed(2)}` : '-'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-text-muted">{entry.refPath || entry.refId || '-'}</td>
                  <td className="px-6 py-4"><span className="badge badge-gold">{entry.status || '-'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
