import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { db, auth } from './firebase';

const env = (import.meta as any).env;
const BEP20_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export const USDT_BEP20_ADDRESS = String(env.VITE_USDT_BEP20_ADDRESS || '').trim();
export const IS_USDT_BEP20_ADDRESS_CONFIGURED = BEP20_ADDRESS_RE.test(USDT_BEP20_ADDRESS);
export const USDT_BEP20_ADDRESS_DISPLAY = IS_USDT_BEP20_ADDRESS_CONFIGURED ? USDT_BEP20_ADDRESS : 'Deposit address is not configured';
export const MIN_INVESTMENT = 50;
export const MIN_PROFIT_WITHDRAWAL = 50;

// Legacy flat-rate constants (kept for backward compatibility in Firestore rules validation)
export const MIN_DAILY_RATE = 0.005;
export const MAX_DAILY_RATE = 0.01;

// Progressive tier-based rates
export const INVESTMENT_TIERS = [
  { name: 'Starter', minAmount: 50, maxAmount: 499, dailyRateMin: 0.005, dailyRateMax: 0.01 },
  { name: 'Growth', minAmount: 500, maxAmount: 4999, dailyRateMin: 0.01, dailyRateMax: 0.012 },
  { name: 'Elite', minAmount: 5000, maxAmount: Infinity, dailyRateMin: 0.012, dailyRateMax: 0.015 },
] as const;

export function getTierForAmount(amount: number) {
  return INVESTMENT_TIERS.find(t => amount >= t.minAmount && amount <= t.maxAmount) || INVESTMENT_TIERS[0];
}

export function isValidBep20Address(value?: string | null) {
  return BEP20_ADDRESS_RE.test(String(value || '').trim());
}

export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string | null;
  onboardingComplete?: boolean;
  role?: 'user' | 'admin' | 'reviewer' | 'finance';
  adminRole?: 'super_admin' | 'finance' | 'compliance' | 'support' | null;
  referralCode?: string | null;
  referredBy?: string | null;
  referralStatus?: 'pending' | 'completed' | null;
  referralCommissionPaid?: number;
  refereeBonusPaid?: number;
  phone?: string | null;
  kycStatus?: 'not_started' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt?: Timestamp;
  kycReviewedAt?: Timestamp;
  kycNotes?: string | null;
  kycLegalName?: string | null;
  kycCountry?: string | null;
  kycDocumentType?: string | null;
  kycDocumentNumber?: string | null;
  kycDob?: string | null;
  kycExpiryDate?: string | null;
  kycDocumentUrl?: string | null;
  kycBackDocumentUrl?: string | null;
  accountStatus?: 'active' | 'deletion_requested' | 'disabled';
  deletionRequestedAt?: Timestamp;
  emailVerifiedAt?: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  status: 'pending_deposit' | 'active' | 'pending_settlement' | 'settled' | 'withdrawn' | 'stopped';
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
  type?: 'standard' | 'settlement';
  speed?: 'standard' | 'express';
  fee?: number;
  status: 'pending' | 'paid' | 'rejected';
  walletAddress: string;
  investmentId?: string | null;
  payoutTxHash?: string | null;
  paidAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  type: 'deposit_created' | 'deposit_approved' | 'deposit_rejected' | 'profit_added' | 'withdrawal_requested' | 'withdrawal_paid' | 'withdrawal_rejected' | 'kyc_submitted' | 'wallet_submitted' | 'account_deletion_requested' | 'referral_commission' | 'referral_profit_commission' | 'referee_bonus' | 'reinvestment' | 'settlement_requested' | 'settlement_paid' | 'settlement_rejected';
  amount?: number;
  status?: string;
  refId?: string;
  refPath?: string;
  txHash?: string | null;
  metadata?: Record<string, any>;
  createdAt?: Timestamp;
};

type DashboardTotals = {
  lockedPrincipal: number;
  todayProfit: number;
  totalEarned: number;
  withdrawableProfit: number;
};

type DashboardDataValue = {
  profile: UserProfile | null;
  investments: Investment[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  totals: DashboardTotals;
  loading: boolean;
};

const DashboardDataContext = createContext<DashboardDataValue | null>(null);

function useDashboardDataSource(uid?: string): DashboardDataValue {
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

export function DashboardDataProvider({ uid, children }: { uid?: string; children: ReactNode }) {
  const value = useDashboardDataSource(uid);
  return createElement(DashboardDataContext.Provider, { value }, children);
}

export function useDashboardData(uid?: string): DashboardDataValue {
  const shared = useContext(DashboardDataContext);
  if (shared) return shared;
  return useDashboardDataSource(uid);
}

export async function createDepositRequest(uid: string, amount: number, txHash?: string) {
  ensureDb();
  if (!IS_USDT_BEP20_ADDRESS_CONFIGURED) {
    throw new Error('Deposit address is not configured. Please contact support before sending funds.');
  }
  if (!Number.isFinite(amount) || amount < MIN_INVESTMENT || amount % MIN_INVESTMENT !== 0) {
    throw new Error('Investment amount must be $50 or a $50 multiple.');
  }
  const normalizedTxHash = txHash?.trim().toLowerCase() || '';
  if (!/^0x[a-f0-9]{64}$/.test(normalizedTxHash)) {
    throw new Error('A valid BEP20 transaction hash is required.');
  }

  const investmentRef = doc(collection(db!, 'users', uid, 'investments'));
  const depositRef = doc(collection(db!, 'users', uid, 'deposits'));
  const txHashRef = doc(db!, 'depositTxHashes', normalizedTxHash);
  const batch = writeBatch(db!);
  const payload = {
    amount,
    method: 'usdt_bep20',
    depositAddress: USDT_BEP20_ADDRESS,
    investmentId: investmentRef.id,
    txHash: normalizedTxHash,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  batch.set(depositRef, payload);
  const tier = getTierForAmount(amount);
  batch.set(investmentRef, {
    amount,
    method: 'usdt_bep20',
    status: 'pending_deposit',
    dailyRateMin: tier.dailyRateMin,
    dailyRateMax: tier.dailyRateMax,
    profitAvailable: 0,
    profitTotal: 0,
    depositAddress: USDT_BEP20_ADDRESS,
    txHash: normalizedTxHash,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(txHashRef, {
    uid,
    txHash: normalizedTxHash,
    amount,
    status: 'pending',
    refPath: `users/${uid}/deposits/${depositRef.id}`,
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
    txHash: normalizedTxHash,
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
  if (!auth) throw new Error('Auth system not initialized.');
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== uid) throw new Error('User is not authenticated.');
  if (!Number.isFinite(amount) || amount < MIN_PROFIT_WITHDRAWAL) {
    throw new Error('Minimum profit withdrawal is $50.00');
  }
  if (!isValidBep20Address(walletAddress)) {
    throw new Error('Enter a valid BEP20 wallet address.');
  }
  if (!investmentId) {
    throw new Error('Select an investment before requesting withdrawal.');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch('/api/withdraw', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      amount,
      walletAddress: walletAddress.trim(),
      investmentId,
      speed,
      fee,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Withdrawal request failed.');
  }
}

export async function reinvestProfit(uid: string, amount: number, sourceInvestmentId: string, targetInvestmentId?: string) {
  if (!auth) throw new Error('Auth system not initialized.');
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User is not authenticated.');
  const idToken = await currentUser.getIdToken();

  const response = await fetch('/api/reinvest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ amount, sourceInvestmentId, targetInvestmentId })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Reinvestment failed.');
  }
}

export async function settleAndWithdrawProfit(
  uid: string,
  investmentId: string,
  walletAddress: string,
  speed: 'standard' | 'express',
  fee: number
) {
  if (!auth) throw new Error('Auth system not initialized.');
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('User is not authenticated.');
  const idToken = await currentUser.getIdToken();

  const response = await fetch('/api/settle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ investmentId, walletAddress, speed, fee })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Settlement failed.');
  }
}


export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  ensureDb();
  await updateDoc(doc(db!, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function submitKycRequest(
  uid: string, 
  data: {
    legalName: string;
    country: string;
    documentType: string;
    documentNumber: string;
    dob: string;
    expiryDate: string;
    documentUrl: string;
    backDocumentUrl?: string;
    status: 'verified' | 'pending' | 'rejected';
    notes?: string | null;
  }
) {
  ensureDb();
  const payload = {
    kycStatus: data.status,
    kycSubmittedAt: serverTimestamp(),
    kycReviewedAt: data.status === 'verified' ? serverTimestamp() : null,
    kycNotes: data.notes || null,
    kycLegalName: data.legalName,
    kycCountry: data.country,
    kycDocumentType: data.documentType,
    kycDocumentNumber: data.documentNumber,
    kycDob: data.dob || null,
    kycExpiryDate: data.expiryDate || null,
    kycDocumentUrl: data.documentUrl,
    kycBackDocumentUrl: data.backDocumentUrl || null,
    updatedAt: serverTimestamp(),
  };
  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', uid);
    transaction.update(userRef, payload);
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid,
      type: 'kyc_submitted',
      status: data.status === 'verified' ? 'verified' : 'pending',
      metadata: { 
        legalName: data.legalName, 
        country: data.country, 
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        dob: data.dob,
        expiryDate: data.expiryDate,
        documentUrl: data.documentUrl,
        backDocumentUrl: data.backDocumentUrl || null,
        aiVerified: data.status === 'verified'
      },
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

    const q = query(collection(db, 'ledgerEntries'), where('uid', '==', uid), limit(maxItems));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as LedgerEntry));
      // Sort in memory to avoid requiring a composite index in Firestore
      items.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return dateB - dateA;
      });
      setEntries(items);
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

export function useReferredUsers(referralCode?: string | null) {
  const [referredUsers, setReferredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!referralCode || !db) {
      setReferredUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'users'),
      where('referredBy', '==', referralCode),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setReferredUsers(users);
      setLoading(false);
    }, (error) => {
      console.error('Referred users listener failed:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [referralCode]);

  return { referredUsers, loading };
}
