import React, { useState } from 'react';
import { CheckCircle2, CircleDollarSign, Home, LogOut, RefreshCw, ShieldCheck, Users, Wallet, XCircle, MessageSquare, HelpCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  addInvestmentProfit,
  approveDeposit,
  createApprovalRequest,
  markWithdrawalPaid,
  rejectDeposit,
  rejectWithdrawal,
  reviewApprovalRequest,
  updateKycStatus,
  updateWalletStatus,
  useAdminData,
} from '@/lib/adminData';
import { useAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import type { SupportTicket } from '@/lib/dashboardData';

export function AdminPage() {
  const { user: adminUser, logout } = useAuth();
  const { users, deposits, investments, withdrawals, wallets = [], auditLogs, tickets = [], approvalRequests = [], loading } = useAdminData();
  const [profitInputs, setProfitInputs] = useState<Record<string, string>>({});
  const [payoutTxInputs, setPayoutTxInputs] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'overview' | 'deposits' | 'investments' | 'withdrawals' | 'users' | 'kyc' | 'wallets' | 'approvals' | 'audit' | 'support'>('overview');

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [adminReplyMsg, setAdminReplyMsg] = useState('');
  const [sendEmailChecked, setSendEmailChecked] = useState(true);
  const [replySubmitting, setReplySubmitting] = useState(false);

  const handleAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReplyMsg.trim()) return;

    setReplySubmitting(true);
    try {
      const { addTicketReply } = await import('@/lib/dashboardData');
      await addTicketReply(selectedTicket.id, 'admin', adminReplyMsg.trim());
      
      if (sendEmailChecked) {
        await sendEmail('support_reply', {
          to: selectedTicket.email,
          name: selectedTicket.name,
          data: { message: adminReplyMsg.trim() },
        });
      }

      toast.success('Reply submitted successfully!');
      const newReply = { sender: 'admin', message: adminReplyMsg.trim(), createdAt: new Date() };
      setSelectedTicket({
        ...selectedTicket,
        replies: [...(selectedTicket.replies || []), newReply],
        status: 'resolved'
      });
      setAdminReplyMsg('');
    } catch (error: any) {
      toast.error(error.message || 'Could not send reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const pendingDeposits = deposits.filter((deposit) => deposit.status === 'pending');
  const activeInvestments = investments.filter((investment) => investment.status === 'active');
  const pendingWithdrawals = withdrawals.filter((withdrawal) => withdrawal.status === 'pending');
  const pendingKyc = users.filter((account) => account.kycStatus === 'pending');
  const pendingWallets = wallets.filter((wallet) => wallet.status === 'pending');
  const pendingApprovals = approvalRequests.filter((request) => request.status === 'pending');
  const lockedTotal = users.reduce((sum, user) => sum + Number(user.totals?.lockedPrincipal || 0), 0);
  const findUser = (uid: string) => users.find((user) => user.uid === uid);
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: Home, count: null },
    { id: 'deposits' as const, label: 'Deposits', icon: Wallet, count: pendingDeposits.length },
    { id: 'investments' as const, label: 'Investments', icon: ShieldCheck, count: activeInvestments.length },
    { id: 'withdrawals' as const, label: 'Withdrawals', icon: CircleDollarSign, count: pendingWithdrawals.length },
    { id: 'users' as const, label: 'Users', icon: Users, count: users.length },
    { id: 'kyc' as const, label: 'KYC', icon: ShieldCheck, count: pendingKyc.length },
    { id: 'wallets' as const, label: 'Wallets', icon: Wallet, count: pendingWallets.length },
    { id: 'approvals' as const, label: 'Approvals', icon: ShieldCheck, count: pendingApprovals.length },
    { id: 'support' as const, label: 'Support', icon: HelpCircle, count: tickets.filter((t) => t.status === 'open').length },
    { id: 'audit' as const, label: 'Audit Log', icon: ShieldCheck, count: auditLogs.length },
  ];

  const runAction = async (action: () => Promise<void>, success: string) => {
    try {
      await action();
      toast.success(success);
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-text-primary flex">
      <aside className="hidden lg:flex w-[280px] shrink-0 flex-col bg-dark-950 border-r border-gold-500/10 sticky top-0 h-screen">
        <div className="h-20 px-6 flex items-center border-b border-gold-500/10">
          <div>
            <h1 className="font-display text-2xl text-white">GoldEx Admin</h1>
            <p className="text-xs text-text-muted">Control center</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-colors ${activeSection === item.id ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20' : 'text-text-secondary hover:text-white hover:bg-dark-800'}`}
            >
              <span className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-sans text-sm font-medium">{item.label}</span>
              </span>
              {item.count !== null && <span className="font-mono text-xs bg-dark-900 border border-gold-500/10 rounded-full px-2 py-0.5">{item.count}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gold-500/10 space-y-2">
          <button onClick={() => window.location.reload()} className="btn-ghost w-full justify-center h-10 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={logout} className="btn-ghost w-full justify-center h-10 text-sm text-danger">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-dark-950/90 backdrop-blur-xl border-b border-gold-500/10">
          <div className="px-4 sm:px-6 lg:px-8 h-auto lg:h-20 py-4 lg:py-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl text-white">Admin Dashboard</h1>
              <p className="text-xs text-text-muted">Manage real users, deposits, investments, and withdrawals</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`lg:hidden shrink-0 px-3 py-2 rounded-lg text-xs font-medium border ${activeSection === item.id ? 'bg-gold-500/10 border-gold-500/30 text-gold-500' : 'border-gold-500/10 text-text-secondary'}`}
                >
                  {item.label}
                </button>
              ))}
              <button onClick={() => window.location.reload()} className="btn-ghost h-10 px-4 text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button onClick={logout} className="btn-ghost h-10 px-4 text-sm text-danger">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {(activeSection === 'overview' || activeSection === 'deposits') && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Users', value: users.length, icon: Users },
                { label: 'Pending Deposits', value: pendingDeposits.length, icon: Wallet },
                { label: 'Active Investments', value: activeInvestments.length, icon: ShieldCheck },
                { label: 'Locked Principal', value: `$${lockedTotal.toFixed(2)}`, icon: CircleDollarSign },
              ].map((stat) => (
                <div key={stat.label} className="gc p-5 bg-dark-950">
                  <stat.icon className="w-5 h-5 text-gold-500 mb-4" />
                  <p className="text-xs uppercase tracking-wider text-text-muted">{stat.label}</p>
                  <p className="text-2xl font-mono text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {loading && <div className="gc p-6 text-text-muted">Loading admin data...</div>}

          {(activeSection === 'overview' || activeSection === 'deposits') && <Section title="Pending Deposits">
          <Table headers={['User', 'Amount', 'TX Hash', 'Investment', 'Actions']}>
            {pendingDeposits.length === 0 ? <EmptyRow colSpan={5} label="No pending deposits." /> : pendingDeposits.map((deposit) => (
              <tr key={deposit.id} className="border-b border-gold-500/10">
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(deposit.uid)?.displayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(deposit.uid)?.email || deposit.uid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-white">${Number(deposit.amount || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[220px] truncate">{deposit.txHash || '-'}</td>
                <td className="px-4 py-3 text-xs text-text-muted">
                  <div>
                    <p className="font-sans font-medium text-gold-500">{Number(deposit.amount || 0) >= 5000 ? 'Elite' : Number(deposit.amount || 0) >= 500 ? 'Growth' : 'Starter'}</p>
                    <p className="text-[10px] text-text-muted">{deposit.investmentId || '-'}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => runAction(async () => {
                      await approveDeposit(deposit, adminUser?.uid || 'unknown-admin');
                      const account = findUser(deposit.uid);
                      await sendEmail('deposit_verified', { to: account?.email, name: account?.displayName, data: { amount: deposit.amount } });
                      const amountNum = Number(deposit.amount || 0);
                      const planName = amountNum >= 5000 ? 'Elite' : amountNum >= 500 ? 'Growth' : 'Starter';
                      await sendEmail('investment_selected', { to: account?.email, name: account?.displayName, data: { amount: deposit.amount, plan: planName } });
                    }, 'Deposit approved')} className="btn-gold h-9 px-3 text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => runAction(async () => {
                      await rejectDeposit(deposit, adminUser?.uid || 'unknown-admin');
                      const account = findUser(deposit.uid);
                      await sendEmail('deposit_rejected', { to: account?.email, name: account?.displayName, data: { amount: deposit.amount } });
                    }, 'Deposit rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'investments') && <Section title="Active Investments">
          <Table headers={['User', 'Amount', 'Profit Available', 'Total Profit', 'Add Profit']}>
            {activeInvestments.length === 0 ? <EmptyRow colSpan={5} label="No active investments." /> : activeInvestments.map((investment) => (
              <tr key={investment.id} className="border-b border-gold-500/10">
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(investment.uid)?.displayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(investment.uid)?.email || investment.uid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-white">${Number(investment.amount || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-profit-green">${Number(investment.profitAvailable || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-white">${Number(investment.profitTotal || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      value={profitInputs[investment.id] || ''}
                      onChange={(event) => setProfitInputs((prev) => ({ ...prev, [investment.id]: event.target.value }))}
                      type="number"
                      min="0"
                      step="0.01"
                      className="input-gold h-9 py-1 max-w-[120px] font-mono"
                      placeholder="0.00"
                    />
                    <button
                      onClick={() => {
                        const amount = Number(profitInputs[investment.id] || 0);
                        if (amount <= 0) return toast.error('Enter profit amount');
                        runAction(() => createApprovalRequest({
                          action: 'profit_add',
                          targetUid: investment.uid,
                          targetPath: `users/${investment.uid}/investments/${investment.id}`,
                          amount,
                          payload: { investmentId: investment.id },
                          requestedBy: adminUser?.uid || 'unknown-admin',
                        }), 'Profit approval requested');
                        setProfitInputs((prev) => ({ ...prev, [investment.id]: '' }));
                      }}
                      className="btn-gold h-9 px-3 text-xs"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'withdrawals') && <Section title="Pending Withdrawals">
          <Table headers={['User', 'Amount', 'Investment', 'Wallet', 'Status', 'Actions']}>
            {pendingWithdrawals.length === 0 ? <EmptyRow colSpan={6} label="No pending withdrawals." /> : pendingWithdrawals.map((withdrawal) => {
              const linkedInv = investments.find((inv) => inv.id === withdrawal.investmentId);
              const planName = linkedInv ? (Number(linkedInv.amount || 0) >= 5000 ? 'Elite' : Number(linkedInv.amount || 0) >= 500 ? 'Growth' : 'Starter') : 'N/A';
              return (
                <tr key={withdrawal.id} className="border-b border-gold-500/10">
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    <div>
                      <p className="font-sans font-medium text-white">{findUser(withdrawal.uid)?.displayName || 'Unknown User'}</p>
                      <p className="text-[10px] text-text-muted">{findUser(withdrawal.uid)?.email || withdrawal.uid}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-white">${Number(withdrawal.amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    <div>
                      <p className="font-sans font-medium text-gold-500">{planName}</p>
                      <p className="text-[10px] text-text-muted">{withdrawal.investmentId || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[280px] truncate">{withdrawal.walletAddress}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{withdrawal.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={payoutTxInputs[withdrawal.id] || ''}
                      onChange={(event) => setPayoutTxInputs((prev) => ({ ...prev, [withdrawal.id]: event.target.value }))}
                      className="input-gold h-9 py-1 max-w-[180px] font-mono text-xs"
                      placeholder="Payout tx hash"
                    />
                    <button onClick={() => runAction(async () => {
                      await markWithdrawalPaid(withdrawal, adminUser?.uid || 'unknown-admin', payoutTxInputs[withdrawal.id]);
                      const account = findUser(withdrawal.uid);
                      await sendEmail('withdrawal_paid', { to: account?.email, name: account?.displayName, data: { amount: withdrawal.amount } });
                    }, 'Withdrawal marked paid')} className="btn-gold h-9 px-3 text-xs">Paid</button>
                    <button onClick={() => runAction(async () => {
                      await rejectWithdrawal(withdrawal, adminUser?.uid || 'unknown-admin');
                      const account = findUser(withdrawal.uid);
                      await sendEmail('withdrawal_rejected', { to: account?.email, name: account?.displayName, data: { amount: withdrawal.amount } });
                    }, 'Withdrawal rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                  </div>
                </td>
              </tr>
            );
          })}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'users') && <Section title="Users">
          <Table headers={['Name', 'Email', 'Role', 'Referral', 'Referred By', 'Locked', 'Withdrawable']}>
            {users.length === 0 ? <EmptyRow colSpan={7} label="No users found." /> : users.map((user) => (
              <tr key={user.uid} className="border-b border-gold-500/10">
                <td className="px-4 py-3 text-white">{user.displayName || 'Account'}</td>
                <td className="px-4 py-3 text-text-secondary">{user.email || '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{user.role || 'user'}</span></td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{user.referralCode || '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{user.referredBy || '-'}</td>
                <td className="px-4 py-3 font-mono text-white">${Number(user.totals?.lockedPrincipal || 0).toFixed(2)}</td>
                <td className="px-4 py-3 font-mono text-profit-green">${Number(user.totals?.withdrawableProfit || 0).toFixed(2)}</td>
              </tr>
            ))}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'kyc') && <Section title="KYC Review Queue">
          <Table headers={['Name', 'Email', 'Status', 'Notes', 'Actions']}>
            {pendingKyc.length === 0 ? <EmptyRow colSpan={5} label="No pending KYC reviews." /> : pendingKyc.map((account) => (
              <tr key={account.uid} className="border-b border-gold-500/10">
                <td className="px-4 py-3 text-white">{account.displayName || 'Account'}</td>
                <td className="px-4 py-3 text-text-secondary">{account.email || '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{account.kycStatus}</span></td>
                <td className="px-4 py-3 text-xs text-text-muted">{account.kycNotes || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => runAction(() => updateKycStatus(account, 'verified', adminUser?.uid || 'unknown-admin'), 'KYC verified')} className="btn-gold h-9 px-3 text-xs">Verify</button>
                    <button onClick={() => runAction(() => updateKycStatus(account, 'rejected', adminUser?.uid || 'unknown-admin', 'Rejected by admin review'), 'KYC rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'wallets') && <Section title="Wallet Whitelist Review">
          <Table headers={['User', 'Label', 'Address', 'Status', 'Actions']}>
            {pendingWallets.length === 0 ? <EmptyRow colSpan={5} label="No pending wallet requests." /> : pendingWallets.map((wallet) => (
              <tr key={wallet.id} className="border-b border-gold-500/10">
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(wallet.uid)?.displayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(wallet.uid)?.email || wallet.uid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-white">{wallet.label || 'BEP20 wallet'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted max-w-[320px] truncate">{wallet.address}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{wallet.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => runAction(() => updateWalletStatus(wallet.uid, wallet.id, 'approved', adminUser?.uid || 'unknown-admin'), 'Wallet approved')} className="btn-gold h-9 px-3 text-xs">Approve</button>
                    <button onClick={() => runAction(() => updateWalletStatus(wallet.uid, wallet.id, 'rejected', adminUser?.uid || 'unknown-admin'), 'Wallet rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'approvals') && <Section title="Maker-Checker Approvals">
          <Table headers={['Date', 'Action', 'Maker', 'User', 'Amount', 'Status', 'Actions']}>
            {approvalRequests.length === 0 ? <EmptyRow colSpan={7} label="No approval requests." /> : approvalRequests.slice(0, 80).map((request) => (
              <tr key={request.id} className="border-b border-gold-500/10">
                <td className="px-4 py-3 text-text-secondary">{request.createdAt?.toDate ? request.createdAt.toDate().toLocaleString() : '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{request.action}</span></td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(request.requestedBy)?.displayName || 'Admin'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(request.requestedBy)?.email || request.requestedBy}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(request.targetUid)?.displayName || 'Unknown User'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(request.targetUid)?.email || request.targetUid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-white">{typeof request.amount === 'number' ? `$${request.amount.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{request.status}</span></td>
                <td className="px-4 py-3">
                  {request.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => runAction(async () => {
                        if (request.action === 'profit_add') {
                          const investmentId = request.payload?.investmentId;
                          const investment = investments.find((item) => item.id === investmentId && item.uid === request.targetUid);
                          if (!investment || typeof request.amount !== 'number') throw new Error('Linked investment not found.');
                          await addInvestmentProfit(investment, request.amount, adminUser?.uid || 'unknown-admin');
                        }
                        await reviewApprovalRequest(request, 'approved', adminUser?.uid || 'unknown-admin');
                      }, 'Approval executed')} className="btn-gold h-9 px-3 text-xs">Approve</button>
                      <button onClick={() => runAction(() => reviewApprovalRequest(request, 'rejected', adminUser?.uid || 'unknown-admin'), 'Approval rejected')} className="btn-ghost h-9 px-3 text-xs text-danger">Reject</button>
                    </div>
                  ) : <span className="text-xs text-text-muted">Reviewed by {request.reviewedBy || '-'}</span>}
                </td>
              </tr>
            ))}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'audit') && <Section title="Admin Audit Log">
          <Table headers={['Date', 'Action', 'Admin', 'User', 'Amount', 'Record']}>
            {auditLogs.length === 0 ? <EmptyRow colSpan={6} label="No admin actions recorded yet." /> : auditLogs.slice(0, 50).map((log) => (
              <tr key={log.id} className="border-b border-gold-500/10">
                <td className="px-4 py-3 text-text-secondary">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : '-'}</td>
                <td className="px-4 py-3"><span className="badge badge-gold">{log.action}</span></td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(log.actorUid)?.displayName || 'Admin'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(log.actorUid)?.email || log.actorUid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-sans font-medium text-white">{findUser(log.targetUid)?.displayName || '-'}</p>
                    <p className="text-[10px] text-text-muted">{findUser(log.targetUid)?.email || log.targetUid}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-white">{typeof log.amount === 'number' ? `$${log.amount.toFixed(2)}` : '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{log.collection}/{log.recordId}</td>
              </tr>
            ))}
          </Table>
        </Section>}

        {(activeSection === 'overview' || activeSection === 'support') && <Section title="Live Support Tickets">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 p-4">
            {/* Tickets list */}
            <div className="xl:col-span-4 border border-gold-500/10 rounded-2xl bg-dark-900/30 overflow-hidden flex flex-col max-h-[500px]">
              <div className="p-4 border-b border-gold-500/10 bg-dark-950/60 font-semibold text-white">Tickets</div>
              <div className="divide-y divide-gold-500/10 overflow-y-auto flex-1">
                {tickets.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs">No tickets submitted.</div>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSendEmailChecked(true);
                      }}
                      className={`w-full text-left p-4 hover:bg-dark-800/20 transition-colors flex items-center justify-between gap-3 ${selectedTicket?.id === ticket.id ? 'bg-gold-500/5' : ''}`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : 'bg-profit-green'}`} />
                          <p className="text-sm text-white font-medium truncate">{ticket.subject}</p>
                        </div>
                        <p className="text-xs text-text-muted truncate">{ticket.message}</p>
                        <p className="text-[10px] text-text-secondary font-mono truncate">{ticket.email}</p>
                      </div>
                      {ticket.replies && ticket.replies.length > 0 && (
                        <span className="text-[10px] text-gold-500 font-mono bg-gold-500/10 px-1.5 py-0.5 rounded shrink-0">
                          {ticket.replies.length}R
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Ticket details & Reply */}
            <div className="xl:col-span-8 border border-gold-500/10 rounded-2xl bg-dark-900/30 overflow-hidden flex flex-col min-h-[400px] max-h-[500px]">
              {selectedTicket ? (
                <>
                  <div className="p-4 border-b border-gold-500/10 bg-dark-950/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{selectedTicket.subject}</h4>
                      <p className="text-xs text-text-muted">User: {selectedTicket.name} ({selectedTicket.email})</p>
                    </div>
                    <span className="badge badge-gold shrink-0">
                      {selectedTicket.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                  </div>

                  <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {/* Original Message */}
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="rounded-xl rounded-tl-none bg-dark-950 border border-gold-500/10 p-3 text-sm text-white">
                        <p className="text-[10px] text-gold-500 font-semibold mb-1">{selectedTicket.name}</p>
                        {selectedTicket.message}
                      </div>
                      <span className="text-[9px] text-text-muted mt-1 ml-1 font-mono">
                        {selectedTicket.createdAt?.toDate ? selectedTicket.createdAt.toDate().toLocaleString() : 'Just now'}
                      </span>
                    </div>

                    {/* Replies */}
                    {selectedTicket.replies?.map((reply: SupportTicket['replies'][number], idx: number) => {
                      const isAdminReply = reply.sender === 'admin';
                      return (
                        <div key={idx} className={`flex flex-col max-w-[85%] ${isAdminReply ? 'ml-auto items-end' : 'items-start'}`}>
                          <div className={`rounded-xl p-3 text-sm ${isAdminReply ? 'rounded-tr-none bg-gold-500/10 border border-gold-500/20 text-white' : 'rounded-tl-none bg-dark-950 border border-gold-500/10 text-white'}`}>
                            <p className={`text-[10px] font-semibold mb-1 ${isAdminReply ? 'text-gold-500' : 'text-text-secondary'}`}>
                              {isAdminReply ? '🛡️ Support (You)' : selectedTicket.name}
                            </p>
                            {reply.message}
                          </div>
                          <span className="text-[9px] text-text-muted mt-1 mr-1 font-mono">
                            {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : reply.createdAt?.toLocaleString ? reply.createdAt.toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleAdminReply} className="p-4 border-t border-gold-500/10 bg-dark-950/40 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="send-email-check"
                        checked={sendEmailChecked}
                        onChange={(e) => setSendEmailChecked(e.target.checked)}
                        className="rounded border-gold-500/30 text-gold-500 bg-dark-900 focus:ring-0 focus:ring-offset-0"
                      />
                      <label htmlFor="send-email-check" className="text-xs text-text-secondary select-none">
                        Send email reply notification to user's registered email ({selectedTicket.email})
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        required
                        value={adminReplyMsg}
                        onChange={(e) => setAdminReplyMsg(e.target.value)}
                        placeholder="Type reply message..."
                        disabled={replySubmitting}
                        className="flex-1 bg-dark-900 border border-gold-500/20 focus:border-gold-500 rounded-xl px-4 py-2 text-sm text-white focus:outline-none transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={replySubmitting || !adminReplyMsg.trim()}
                        className="btn-gold h-10 px-4 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-12">
                  <MessageSquare className="w-12 h-12 text-gold-500/25 mb-3" />
                  <p className="text-sm">Select a ticket from the left panel to reply.</p>
                </div>
              )}
            </div>
          </div>
        </Section>}
      </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gc p-0 overflow-hidden bg-dark-950">
      <div className="p-5 border-b border-gold-500/10">
        <h2 className="text-lg font-display text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-text-muted uppercase bg-dark-900/60">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-text-muted">{label}</td>
    </tr>
  );
}
