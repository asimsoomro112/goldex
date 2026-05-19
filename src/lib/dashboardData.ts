import { useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const env = (import.meta as any).env;

export const USDT_BEP20_ADDRESS = env.VITE_USDT_BEP20_ADDRESS || 'PASTE_USDT_BEP20_ADDRESS_HERE';
export const MIN_INVESTMENT = 50;
export const MIN_PROFIT_WITHDRAWAL = 50;
export const MIN_DAILY_RATE = 0.005;
export const MAX_DAILY_RATE = 0.01;

export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  role?: 'user' | 'admin' | 'reviewer' | 'finance';
  adminRole?: 'super_admin' | 'finance' | 'compliance' | 'support' | null;
  referralCode?: string | null;
  referredBy?: string | null;
  phone?: string | null;
  kycStatus?: 'not_started' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt?: Timestamp;
  kycReviewedAt?: Timestamp;
  kycNotes?: string | null;
  accountStatus?: 'active' | 'deletion_requested' | 'disabled';
  emailVerifiedAt?: Timestamp | null;
  notificationPrefs?: {
    profit?: boolean;
    referral?: boolean;
    withdraw?: boolean;
    ai?: boolean;
    security?: boolean;
    marketing?: boolean;
  };
  totals?: {
    lockedPrincipal?: number;
    todayProfit?: number;
    totalEarned?: number;
    withdrawableProfit?: number;
  };
};

export type Investment = {
  id: string;
  amount: number;
  method: 'usdt_bep20';
  status: 'pending_deposit' | 'active' | 'withdrawn' | 'stopped';
  dailyRateMin: number;
  dailyRateMax: number;
  profitAvailable: number;
  profitTotal: number;
  createdAt?: Timestamp;
  txHash?: string;
};

export type Deposit = {
  id: string;
  amount: number;
  method: 'usdt_bep20';
  status: 'pending' | 'verified' | 'rejected';
  investmentId?: string;
  txHash?: string;
  networkConfirmations?: number;
  lastCheckedAt?: Timestamp;
  createdAt?: Timestamp;
  rejectionReason?: string;
};

export type Withdrawal = {
  id: string;
  amount: number;
  method: 'usdt_bep20';
  status: 'pending' | 'paid' | 'rejected';
  walletAddress: string;
  investmentId?: string | null;
  payoutTxHash?: string | null;
  paidAt?: Timestamp;
  createdAt?: Timestamp;
  rejectionReason?: string;
};

export type WalletRecord = {
  id: string;
  address: string;
  label?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  reviewedAt?: Timestamp;
};

export type LedgerEntry = {
  id: string;
  uid: string;
  type: 'deposit_created' | 'deposit_approved' | 'deposit_rejected' | 'profit_added' | 'withdrawal_requested' | 'withdrawal_paid' | 'withdrawal_rejected' | 'kyc_submitted' | 'wallet_submitted' | 'account_deletion_requested';
  amount?: number;
  status?: string;
  refId?: string;
  refPath?: string;
  txHash?: string | null;
  metadata?: Record<string, any>;
  createdAt?: Timestamp;
};

export function useDashboardData(uid?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) {
      setProfile(null);
      setInvestments([]);
      setDeposits([]);
      setWithdrawals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribers = [
      onSnapshot(doc(db, 'users', uid), (snapshot) => {
        setProfile(snapshot.exists() ? snapshot.data() as UserProfile : null);
        setLoading(false);
      }, (error) => {
        console.error('User profile listener failed:', error);
        setLoading(false);
      }),
      onSnapshot(query(collection(db, 'users', uid, 'investments'), orderBy('createdAt', 'desc')), (snapshot) => {
        setInvestments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Investment)));
      }, (error) => {
        console.error('Investments listener failed:', error);
        setInvestments([]);
      }),
      onSnapshot(query(collection(db, 'users', uid, 'deposits'), orderBy('createdAt', 'desc')), (snapshot) => {
        setDeposits(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Deposit)));
      }, (error) => {
        console.error('Deposits listener failed:', error);
        setDeposits([]);
      }),
      onSnapshot(query(collection(db, 'users', uid, 'withdrawals'), orderBy('createdAt', 'desc')), (snapshot) => {
        setWithdrawals(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Withdrawal)));
      }, (error) => {
        console.error('Withdrawals listener failed:', error);
        setWithdrawals([]);
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [uid]);

  const totals = useMemo(() => {
    const fromProfile = profile?.totals || {};
    const lockedPrincipal = fromProfile.lockedPrincipal ?? investments
      .filter((investment) => investment.status === 'active' || investment.status === 'pending_deposit')
      .reduce((sum, investment) => sum + Number(investment.amount || 0), 0);
    const withdrawableProfit = fromProfile.withdrawableProfit ?? investments
      .filter((investment) => investment.status === 'active')
      .reduce((sum, investment) => sum + Number(investment.profitAvailable || 0), 0);
    const totalEarned = fromProfile.totalEarned ?? investments
      .reduce((sum, investment) => sum + Number(investment.profitTotal || 0), 0);

    return {
      lockedPrincipal,
      todayProfit: fromProfile.todayProfit ?? 0,
      totalEarned,
      withdrawableProfit,
    };
  }, [investments, profile]);

  return { profile, investments, deposits, withdrawals, totals, loading };
}

export async function createDepositRequest(uid: string, amount: number, txHash?: string) {
  ensureDb();
  if (!Number.isFinite(amount) || amount < MIN_INVESTMENT || amount % MIN_INVESTMENT !== 0) {
    throw new Error('Investment amount must be $50 or a $50 multiple.');
  }

  const investmentRef = doc(collection(db!, 'users', uid, 'investments'));
  const depositRef = doc(collection(db!, 'users', uid, 'deposits'));
  const batch = writeBatch(db!);
  const payload = {
    amount,
    method: 'usdt_bep20',
    depositAddress: USDT_BEP20_ADDRESS,
    investmentId: investmentRef.id,
    txHash: txHash || null,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(depositRef, payload);
  batch.set(investmentRef, {
    amount,
    method: 'usdt_bep20',
    status: 'pending_deposit',
    dailyRateMin: MIN_DAILY_RATE,
    dailyRateMax: MAX_DAILY_RATE,
    profitAvailable: 0,
    profitTotal: 0,
    depositAddress: USDT_BEP20_ADDRESS,
    txHash: txHash || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db!, 'ledgerEntries')), {
    uid,
    type: 'deposit_created',
    amount,
    status: 'pending',
    refId: depositRef.id,
    refPath: `users/${uid}/deposits/${depositRef.id}`,
    txHash: txHash || null,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function createWithdrawalRequest(
  uid: string,
  amount: number,
  walletAddress: string,
  investmentId: string,
  speed: 'standard' | 'express',
  fee: number
) {
  ensureDb();
  if (!Number.isFinite(amount) || amount < MIN_PROFIT_WITHDRAWAL) {
    throw new Error('Minimum profit withdrawal is $50.00');
  }
  if (!walletAddress.trim()) {
    throw new Error('USDT BEP20 wallet address is required.');
  }
  if (!investmentId) {
    throw new Error('Select an investment before requesting withdrawal.');
  }

  const withdrawalRef = await addDoc(collection(db!, 'users', uid, 'withdrawals'), {
    amount,
    walletAddress,
    investmentId,
    method: 'usdt_bep20',
    type: 'standard',
    speed,
    fee,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db!, 'ledgerEntries'), {
    uid,
    type: 'withdrawal_requested',
    amount,
    status: 'pending',
    refId: withdrawalRef.id,
    refPath: `users/${uid}/withdrawals/${withdrawalRef.id}`,
    metadata: { walletAddress, investmentId, speed, fee },
    createdAt: serverTimestamp(),
  });
}

export async function reinvestProfit(uid: string, amount: number, sourceInvestmentId: string, targetInvestmentId?: string) {
  ensureDb();
  if (!Number.isFinite(amount) || amount < MIN_PROFIT_WITHDRAWAL) {
    throw new Error('Minimum reinvestment amount is $50.00');
  }

  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', uid);
    const sourceInvRef = doc(db!, 'users', uid, 'investments', sourceInvestmentId);
    
    const userSnap = await transaction.get(userRef);
    const sourceInvSnap = await transaction.get(sourceInvRef);

    if (!userSnap.exists()) throw new Error('User record not found.');
    if (!sourceInvSnap.exists()) throw new Error('Source investment record not found.');

    const available = Number(userSnap.data()?.totals?.withdrawableProfit || 0);
    const sourceInvAvailable = Number(sourceInvSnap.data()?.profitAvailable || 0);

    if (available < amount || sourceInvAvailable < amount) {
      throw new Error('Insufficient profit available.');
    }

    const bonusAmount = amount * 1.05; // 5% bonus

    // Deduct from source investment & user totals
    transaction.update(sourceInvRef, {
      profitAvailable: increment(-amount),
      updatedAt: serverTimestamp(),
    });

    transaction.update(userRef, {
      'totals.withdrawableProfit': increment(-amount),
      'totals.lockedPrincipal': increment(bonusAmount),
      updatedAt: serverTimestamp(),
    });

    let activeInvId = '';
    if (targetInvestmentId) {
      // Top up existing investment
      const targetInvRef = doc(db!, 'users', uid, 'investments', targetInvestmentId);
      const targetInvSnap = await transaction.get(targetInvRef);
      if (!targetInvSnap.exists()) throw new Error('Target investment portfolio not found.');
      
      transaction.update(targetInvRef, {
        amount: increment(bonusAmount),
        updatedAt: serverTimestamp(),
      });
      activeInvId = targetInvestmentId;
    } else {
      // Create new investment portfolio (active immediately)
      const newInvRef = doc(collection(db!, 'users', uid, 'investments'));
      transaction.set(newInvRef, {
        amount: bonusAmount,
        status: 'active',
        profitAvailable: 0,
        profitTotal: 0,
        depositAddress: 'Internal Reinvestment',
        txHash: 'reinvestment',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      activeInvId = newInvRef.id;
    }

    // Add ledger entry
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid,
      type: 'reinvestment',
      amount: amount,
      bonus: amount * 0.05,
      status: 'completed',
      refId: activeInvId,
      refPath: `users/${uid}/investments/${activeInvId}`,
      createdAt: serverTimestamp(),
    });
  });
}

export async function settleAndWithdrawProfit(
  uid: string,
  investmentId: string,
  walletAddress: string,
  speed: 'standard' | 'express',
  fee: number
) {
  ensureDb();
  if (!walletAddress.trim()) {
    throw new Error('USDT BEP20 wallet address is required.');
  }

  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', uid);
    const investmentRef = doc(db!, 'users', uid, 'investments', investmentId);
    
    const userSnap = await transaction.get(userRef);
    const invSnap = await transaction.get(investmentRef);

    if (!userSnap.exists()) throw new Error('User record not found.');
    if (!invSnap.exists()) throw new Error('Investment record not found.');

    const inv = invSnap.data();
    if (inv.status !== 'active') {
      throw new Error('Investment portfolio is not active.');
    }

    const availableProfit = Number(inv.profitAvailable || 0);
    if (availableProfit < MIN_PROFIT_WITHDRAWAL) {
      throw new Error('Minimum settlement profit is $50.00');
    }

    // Set investment status to pending_settlement
    transaction.update(investmentRef, {
      status: 'pending_settlement',
      updatedAt: serverTimestamp(),
    });

    const withdrawalRef = doc(collection(db!, 'users', uid, 'withdrawals'));
    transaction.set(withdrawalRef, {
      amount: availableProfit,
      walletAddress,
      investmentId,
      method: 'usdt_bep20',
      type: 'settlement',
      speed,
      fee,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid,
      type: 'settlement_requested',
      amount: availableProfit,
      status: 'pending',
      refId: withdrawalRef.id,
      refPath: `users/${uid}/withdrawals/${withdrawalRef.id}`,
      metadata: { walletAddress, investmentId, speed, fee },
      createdAt: serverTimestamp(),
    });
  });
}


export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  ensureDb();
  await updateDoc(doc(db!, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function submitKycRequest(uid: string, legalName: string, country: string, documentType: string) {
  ensureDb();
  const payload = {
    kycStatus: 'pending' as const,
    kycSubmittedAt: serverTimestamp(),
    kycNotes: null,
    updatedAt: serverTimestamp(),
  };
  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', uid);
    transaction.update(userRef, payload);
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid,
      type: 'kyc_submitted',
      status: 'pending',
      metadata: { legalName, country, documentType },
      createdAt: serverTimestamp(),
    });
  });
}

export async function requestAccountDeletion(uid: string) {
  ensureDb();
  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', uid);
    transaction.update(userRef, {
      accountStatus: 'deletion_requested',
      deletionRequestedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid,
      type: 'account_deletion_requested',
      status: 'pending',
      refPath: `users/${uid}`,
      createdAt: serverTimestamp(),
    });
  });
}

export function useWalletWhitelist(uid?: string) {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) {
      setWallets([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(query(collection(db, 'users', uid, 'wallets'), orderBy('createdAt', 'desc')), (snapshot) => {
      setWallets(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as WalletRecord)));
      setLoading(false);
    }, (error) => {
      console.error('Wallet whitelist listener failed:', error);
      setWallets([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { wallets, loading };
}

export async function submitWalletWhitelistRequest(uid: string, address: string, label?: string) {
  ensureDb();
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    throw new Error('Enter a valid BEP20 wallet address.');
  }

  const walletRef = await addDoc(collection(db!, 'users', uid, 'wallets'), {
    address: trimmed,
    label: label?.trim() || 'BEP20 wallet',
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db!, 'ledgerEntries'), {
    uid,
    type: 'wallet_submitted',
    status: 'pending',
    refId: walletRef.id,
    refPath: `users/${uid}/wallets/${walletRef.id}`,
    metadata: { address: trimmed, label: label || null },
    createdAt: serverTimestamp(),
  });
}

export function useLedgerEntries(uid?: string, maxItems = 100) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'ledgerEntries'), where('uid', '==', uid), orderBy('createdAt', 'desc'), limit(maxItems));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as LedgerEntry)));
      setLoading(false);
    }, (error) => {
      console.error('Ledger listener failed:', error);
      setEntries([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [maxItems, uid]);

  return { entries, loading };
}

export function buildAccountExport(profile: UserProfile | null, investments: Investment[], deposits: Deposit[], withdrawals: Withdrawal[], wallets: WalletRecord[], ledger: LedgerEntry[]) {
  return {
    exportedAt: new Date().toISOString(),
    profile,
    investments,
    deposits,
    withdrawals,
    wallets,
    ledger,
  };
}

export function downloadJson(filename: string, value: any) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  const headers = Array.from(rows.reduce<Set<string>>((keys, row) => {
    Object.keys(row).forEach((key) => keys.add(key));
    return keys;
  }, new Set<string>()));
  const escape = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function incrementUserTotals(uid: string, totals: Partial<NonNullable<UserProfile['totals']>>) {
  ensureDb();
  const updates = Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [`totals.${key}`, increment(Number(value || 0))])
  );

  await updateDoc(doc(db!, 'users', uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

function ensureDb() {
  if (!db) {
    throw new Error('Database service is not configured. Please contact support.');
  }
}

export type SupportTicket = {
  id: string;
  uid: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  replies: Array<{
    sender: 'user' | 'admin';
    message: string;
    createdAt: any;
  }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export function useUserTickets(uid?: string) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !db) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'supportTickets'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allTickets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SupportTicket));
      setTickets(allTickets);
      setLoading(false);
    }, (error) => {
      console.error('User tickets listener failed:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { tickets, loading };
}

export async function createSupportTicket(uid: string, name: string, email: string, subject: string, message: string) {
  ensureDb();
  await addDoc(collection(db!, 'supportTickets'), {
    uid,
    name,
    email,
    subject,
    message,
    status: 'open',
    replies: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function addTicketReply(ticketId: string, sender: 'user' | 'admin', message: string) {
  ensureDb();
  const ticketRef = doc(db!, 'supportTickets', ticketId);
  const now = new Date();
  
  await runTransaction(db!, async (transaction) => {
    const snap = await transaction.get(ticketRef);
    if (!snap.exists()) throw new Error('Ticket does not exist');
    const data = snap.data();
    const currentReplies = data.replies || [];
    const newReply = {
      sender,
      message,
      createdAt: Timestamp.fromDate(now),
    };
    
    transaction.update(ticketRef, {
      replies: [...currentReplies, newReply],
      updatedAt: serverTimestamp(),
      status: sender === 'user' ? 'open' : 'resolved',
    });
  });
}
