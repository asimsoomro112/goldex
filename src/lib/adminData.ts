import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
  getDocs,
  where,
  getDoc,
  limit,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import { Deposit, Investment, UserProfile, WalletRecord, Withdrawal, SupportTicket } from './dashboardData';

type AdminRecord<T> = T & {
  uid: string;
};

export type AdminAuditLog = {
  id: string;
  actorUid: string;
  targetUid: string;
  action: string;
  amount?: number;
  recordId?: string;
  collection?: string;
  createdAt?: { toMillis?: () => number; toDate?: () => Date };
};

export type AdminApprovalRequest = {
  id: string;
  action: string;
  targetUid: string;
  targetPath?: string;
  amount?: number;
  payload?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  reviewedBy?: string;
  createdAt?: { toMillis?: () => number; toDate?: () => Date };
  reviewedAt?: { toMillis?: () => number; toDate?: () => Date };
};

export function useAdminData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [deposits, setDeposits] = useState<Array<AdminRecord<Deposit>>>([]);
  const [investments, setInvestments] = useState<Array<AdminRecord<Investment>>>([]);
  const [withdrawals, setWithdrawals] = useState<Array<AdminRecord<Withdrawal>>>([]);
  const [wallets, setWallets] = useState<Array<AdminRecord<WalletRecord>>>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<AdminApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const unsubscribers = [
      onSnapshot(query(collection(db, 'users'), orderBy('createdAt', 'desc')), (snapshot) => {
        setUsers(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() } as UserProfile)));
        setLoading(false);
      }, (error) => {
        console.error('Admin users listener failed:', error);
        setLoading(false);
      }),
      onSnapshot(query(collectionGroup(db, 'deposits')), (snapshot) => {
        setDeposits(sortByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, uid: item.ref.parent.parent!.id, ...item.data() } as AdminRecord<Deposit>))));
      }, (error) => {
        console.error('Admin deposits listener failed:', error);
        setDeposits([]);
      }),
      onSnapshot(query(collectionGroup(db, 'investments')), (snapshot) => {
        setInvestments(sortByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, uid: item.ref.parent.parent!.id, ...item.data() } as AdminRecord<Investment>))));
      }, (error) => {
        console.error('Admin investments listener failed:', error);
        setInvestments([]);
      }),
      onSnapshot(query(collectionGroup(db, 'withdrawals')), (snapshot) => {
        setWithdrawals(sortByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, uid: item.ref.parent.parent!.id, ...item.data() } as AdminRecord<Withdrawal>))));
      }, (error) => {
        console.error('Admin withdrawals listener failed:', error);
        setWithdrawals([]);
      }),
      onSnapshot(query(collectionGroup(db, 'wallets')), (snapshot) => {
        setWallets(sortByCreatedAtDesc(snapshot.docs.map((item) => ({ id: item.id, uid: item.ref.parent.parent!.id, ...item.data() } as AdminRecord<WalletRecord>))));
      }, (error) => {
        console.error('Admin wallets listener failed:', error);
        setWallets([]);
      }),
      onSnapshot(query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc')), (snapshot) => {
        setTickets(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as SupportTicket)));
      }, (error) => {
        console.error('Admin support tickets listener failed:', error);
        setTickets([]);
      }),
      onSnapshot(query(collection(db, 'adminAuditLogs'), orderBy('createdAt', 'desc')), (snapshot) => {
        setAuditLogs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AdminAuditLog)));
      }, (error) => {
        console.error('Admin audit listener failed:', error);
        setAuditLogs([]);
      }),
      onSnapshot(query(collection(db, 'adminApprovalRequests'), orderBy('createdAt', 'desc')), (snapshot) => {
        setApprovalRequests(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AdminApprovalRequest)));
      }, (error) => {
        console.error('Admin approvals listener failed:', error);
        setApprovalRequests([]);
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  return { users, deposits, investments, withdrawals, wallets, auditLogs, tickets, approvalRequests, loading };
}

export async function approveDeposit(deposit: AdminRecord<Deposit>, actorUid: string) {
  ensureDb();
  const amount = Number(deposit.amount || 0);
  if (!deposit.investmentId) {
    throw new Error('Deposit is not linked to an investment.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Deposit amount is invalid.');
  }

  let referrerRef: DocumentReference | null = null;
  let userSnapshotData: any = null;

  try {
    const userDoc = await getDoc(doc(db!, 'users', deposit.uid));
    if (userDoc.exists()) {
      userSnapshotData = userDoc.data();
      if (userSnapshotData.referredBy && userSnapshotData.referralStatus === 'pending') {
        const q = query(collection(db!, 'users'), where('referralCode', '==', userSnapshotData.referredBy), limit(1));
        const qSnapshot = await getDocs(q);
        if (!qSnapshot.empty) {
          referrerRef = qSnapshot.docs[0].ref;
        }
      }
    }
  } catch (err) {
    console.error('Failed to resolve referrer details:', err);
  }

  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', deposit.uid);
    const depositRef = doc(db!, 'users', deposit.uid, 'deposits', deposit.id);
    const investmentRef = doc(db!, 'users', deposit.uid, 'investments', deposit.investmentId!);
    const depositSnapshot = await transaction.get(depositRef);
    const investmentSnapshot = await transaction.get(investmentRef);
    const userSnapshot = await transaction.get(userRef);

    if (!depositSnapshot.exists()) {
      throw new Error('Deposit record no longer exists.');
    }
    if (depositSnapshot.data().status !== 'pending') {
      throw new Error('Deposit is no longer pending.');
    }
    if (!investmentSnapshot.exists()) {
      throw new Error('Linked investment record no longer exists.');
    }
    if (investmentSnapshot.data().status !== 'pending_deposit') {
      throw new Error('Linked investment is not waiting for deposit approval.');
    }
    if (!userSnapshot.exists()) {
      throw new Error('User record no longer exists.');
    }

    const currentUserData = userSnapshot.data();

    transaction.update(depositRef, {
      status: 'verified',
      updatedAt: serverTimestamp(),
    });
    transaction.update(investmentRef, {
      status: 'active',
      activatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.update(userRef, {
      'totals.lockedPrincipal': increment(amount),
      updatedAt: serverTimestamp(),
    });

    // Check and process referral commissions (strictly one-time check)
    if (referrerRef && currentUserData && currentUserData.referralStatus === 'pending') {
      const referrerSnapshot = await transaction.get(referrerRef);
      if (referrerSnapshot.exists()) {
        const commAmount = Math.floor(amount / 50) * 10;
        const bonusAmount = Math.floor(amount / 50) * 5;

        if (commAmount > 0) {
          // Credit referrer
          transaction.update(referrerRef, {
            'totals.withdrawableProfit': increment(commAmount),
            'totals.totalEarned': increment(commAmount),
            updatedAt: serverTimestamp(),
          });
          transaction.set(doc(collection(db!, 'ledgerEntries')), {
            uid: referrerRef.id,
            type: 'referral_commission',
            amount: commAmount,
            status: 'verified',
            refId: deposit.id,
            refPath: `users/${deposit.uid}/deposits/${deposit.id}`,
            description: `One-time referral commission from ${currentUserData.displayName || 'referred user'} (First investment of $${amount})`,
            createdAt: serverTimestamp(),
          });

          // Credit referee (the referred user)
          transaction.update(userRef, {
            referralStatus: 'completed',
            referralCommissionPaid: commAmount,
            refereeBonusPaid: bonusAmount,
            'totals.withdrawableProfit': increment(bonusAmount),
            'totals.totalEarned': increment(bonusAmount),
            updatedAt: serverTimestamp(),
          });
          transaction.set(doc(collection(db!, 'ledgerEntries')), {
            uid: deposit.uid,
            type: 'referee_bonus',
            amount: bonusAmount,
            status: 'verified',
            refId: deposit.id,
            refPath: `users/${deposit.uid}/deposits/${deposit.id}`,
            description: `One-time referral welcome bonus (First investment of $${amount})`,
            createdAt: serverTimestamp(),
          });

          // Audit log for referral commission processing
          transaction.set(doc(collection(db!, 'adminAuditLogs')), {
            actorUid,
            targetUid: deposit.uid,
            action: 'referral_bonus_processed',
            collection: 'users',
            recordId: deposit.uid,
            amount: commAmount + bonusAmount,
            createdAt: serverTimestamp(),
          });
        }
      }
    }

    transaction.set(doc(collection(db!, 'adminAuditLogs')), {
      actorUid,
      targetUid: deposit.uid,
      action: 'deposit_approved',
      collection: 'deposits',
      recordId: deposit.id,
      amount,
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid: deposit.uid,
      type: 'deposit_approved',
      amount,
      status: 'verified',
      refId: deposit.id,
      refPath: `users/${deposit.uid}/deposits/${deposit.id}`,
      createdAt: serverTimestamp(),
    });
  });
}

export async function rejectDeposit(deposit: AdminRecord<Deposit>, actorUid: string, rejectionReason?: string) {
  ensureDb();
  await runTransaction(db!, async (transaction) => {
    const depositRef = doc(db!, 'users', deposit.uid, 'deposits', deposit.id);
    const investmentRef = deposit.investmentId ? doc(db!, 'users', deposit.uid, 'investments', deposit.investmentId) : null;
    const depositSnapshot = await transaction.get(depositRef);
    const investmentSnapshot = investmentRef ? await transaction.get(investmentRef) : null;

    if (!depositSnapshot.exists()) {
      throw new Error('Deposit record no longer exists.');
    }
    if (depositSnapshot.data().status !== 'pending') {
      throw new Error('Deposit is no longer pending.');
    }

    transaction.update(depositRef, {
      status: 'rejected',
      rejectionReason: rejectionReason || null,
      updatedAt: serverTimestamp(),
    });
    if (investmentRef && investmentSnapshot?.exists() && investmentSnapshot.data().status === 'pending_deposit') {
      transaction.update(investmentRef, {
        status: 'stopped',
        updatedAt: serverTimestamp(),
      });
    }
    transaction.set(doc(collection(db!, 'adminAuditLogs')), {
      actorUid,
      targetUid: deposit.uid,
      action: 'deposit_rejected',
      collection: 'deposits',
      recordId: deposit.id,
      amount: Number(deposit.amount || 0),
      rejectionReason: rejectionReason || null,
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid: deposit.uid,
      type: 'deposit_rejected',
      amount: Number(deposit.amount || 0),
      status: 'rejected',
      refId: deposit.id,
      refPath: `users/${deposit.uid}/deposits/${deposit.id}`,
      createdAt: serverTimestamp(),
    });
  });
}

export async function addInvestmentProfit(investment: AdminRecord<Investment>, amount: number, actorUid: string) {
  ensureDb();
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Profit amount must be greater than zero.');
  }

  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', investment.uid);
    const investmentRef = doc(db!, 'users', investment.uid, 'investments', investment.id);
    const investmentSnapshot = await transaction.get(investmentRef);

    if (!investmentSnapshot.exists()) {
      throw new Error('Investment record no longer exists.');
    }
    if (investmentSnapshot.data().status !== 'active') {
      throw new Error('Profit can only be added to an active investment.');
    }

    transaction.update(investmentRef, {
      profitAvailable: increment(amount),
      profitTotal: increment(amount),
      updatedAt: serverTimestamp(),
    });
    transaction.update(userRef, {
      'totals.todayProfit': increment(amount),
      'totals.totalEarned': increment(amount),
      'totals.withdrawableProfit': increment(amount),
      updatedAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'adminAuditLogs')), {
      actorUid,
      targetUid: investment.uid,
      action: 'profit_added',
      collection: 'investments',
      recordId: investment.id,
      amount,
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid: investment.uid,
      type: 'profit_added',
      amount,
      status: 'credited',
      refId: investment.id,
      refPath: `users/${investment.uid}/investments/${investment.id}`,
      createdAt: serverTimestamp(),
    });
  });
}

export async function markWithdrawalPaid(withdrawal: AdminRecord<Withdrawal>, actorUid: string, payoutTxHash?: string) {
  ensureDb();
  const amount = Number(withdrawal.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Withdrawal amount is invalid.');
  }

  await runTransaction(db!, async (transaction) => {
    const userRef = doc(db!, 'users', withdrawal.uid);
    const withdrawalRef = doc(db!, 'users', withdrawal.uid, 'withdrawals', withdrawal.id);
    const investmentRef = withdrawal.investmentId ? doc(db!, 'users', withdrawal.uid, 'investments', withdrawal.investmentId) : null;
    const userSnapshot = await transaction.get(userRef);
    const withdrawalSnapshot = await transaction.get(withdrawalRef);
    const investmentSnapshot = investmentRef ? await transaction.get(investmentRef) : null;

    if (!userSnapshot.exists()) {
      throw new Error('User record no longer exists.');
    }
    if (!withdrawalSnapshot.exists()) {
      throw new Error('Withdrawal record no longer exists.');
    }

    const available = Number(userSnapshot.data()?.totals?.withdrawableProfit || 0);
    const currentStatus = withdrawalSnapshot.data()?.status;
    const investmentProfit = Number(investmentSnapshot?.data()?.profitAvailable || 0);
    const isSettlement = withdrawalSnapshot.data()?.type === 'settlement';

    if (currentStatus !== 'pending') {
      throw new Error('Withdrawal is no longer pending.');
    }

    if (!investmentRef || !investmentSnapshot?.exists()) {
      throw new Error('Withdrawal is not linked to an investment.');
    }

    if (available < amount) {
      throw new Error('User does not have enough withdrawable profit.');
    }

    if (investmentProfit < amount) {
      throw new Error('Investment does not have enough available profit.');
    }

    transaction.update(withdrawalRef, {
      status: 'paid',
      payoutTxHash: payoutTxHash?.trim() || null,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const principal = Number(investmentSnapshot.data().amount || 0);
    if (isSettlement) {
      transaction.update(userRef, {
        'totals.withdrawableProfit': increment(-amount),
        'totals.lockedPrincipal': increment(-principal), // Deduct full principal from user totals since package is settled
        updatedAt: serverTimestamp(),
      });
      transaction.update(investmentRef, {
        status: 'settled',
        profitAvailable: increment(-amount),
        updatedAt: serverTimestamp(),
      });
    } else {
      transaction.update(userRef, {
        'totals.withdrawableProfit': increment(-amount),
        updatedAt: serverTimestamp(),
      });
      transaction.update(investmentRef, {
        profitAvailable: increment(-amount),
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(doc(collection(db!, 'adminAuditLogs')), {
      actorUid,
      targetUid: withdrawal.uid,
      action: isSettlement ? 'settlement_paid' : 'withdrawal_paid',
      collection: 'withdrawals',
      recordId: withdrawal.id,
      investmentId: withdrawal.investmentId,
      amount,
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid: withdrawal.uid,
      type: isSettlement ? 'settlement_paid' : 'withdrawal_paid',
      amount,
      status: 'paid',
      refId: withdrawal.id,
      refPath: `users/${withdrawal.uid}/withdrawals/${withdrawal.id}`,
      txHash: payoutTxHash?.trim() || null,
      createdAt: serverTimestamp(),
    });
  });
}

export async function rejectWithdrawal(withdrawal: AdminRecord<Withdrawal>, actorUid: string, rejectionReason?: string) {
  ensureDb();
  await runTransaction(db!, async (transaction) => {
    const withdrawalRef = doc(db!, 'users', withdrawal.uid, 'withdrawals', withdrawal.id);
    const withdrawalSnapshot = await transaction.get(withdrawalRef);

    if (!withdrawalSnapshot.exists()) {
      throw new Error('Withdrawal record no longer exists.');
    }
    if (withdrawalSnapshot.data().status !== 'pending') {
      throw new Error('Withdrawal is no longer pending.');
    }

    const isSettlement = withdrawalSnapshot.data().type === 'settlement';

    transaction.update(withdrawalRef, {
      status: 'rejected',
      rejectionReason: rejectionReason || null,
      updatedAt: serverTimestamp(),
    });

    if (isSettlement && withdrawal.investmentId) {
      const investmentRef = doc(db!, 'users', withdrawal.uid, 'investments', withdrawal.investmentId);
      transaction.update(investmentRef, {
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    }

    transaction.set(doc(collection(db!, 'adminAuditLogs')), {
      actorUid,
      targetUid: withdrawal.uid,
      action: isSettlement ? 'settlement_rejected' : 'withdrawal_rejected',
      collection: 'withdrawals',
      recordId: withdrawal.id,
      amount: Number(withdrawal.amount || 0),
      rejectionReason: rejectionReason || null,
      createdAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'ledgerEntries')), {
      uid: withdrawal.uid,
      type: isSettlement ? 'settlement_rejected' : 'withdrawal_rejected',
      amount: Number(withdrawal.amount || 0),
      status: 'rejected',
      refId: withdrawal.id,
      refPath: `users/${withdrawal.uid}/withdrawals/${withdrawal.id}`,
      createdAt: serverTimestamp(),
    });
  });
}

export async function updateKycStatus(user: UserProfile, status: 'verified' | 'rejected', actorUid: string, notes?: string) {
  ensureDb();
  const batch = writeBatch(db!);
  batch.update(doc(db!, 'users', user.uid), {
    kycStatus: status,
    kycNotes: notes || null,
    kycReviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db!, 'adminAuditLogs')), {
    actorUid,
    targetUid: user.uid,
    action: `kyc_${status}`,
    collection: 'users',
    recordId: user.uid,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function updateWalletStatus(uid: string, walletId: string, status: 'approved' | 'rejected' | 'disabled', actorUid: string) {
  ensureDb();
  const batch = writeBatch(db!);
  batch.update(doc(db!, 'users', uid, 'wallets', walletId), {
    status,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(collection(db!, 'adminAuditLogs')), {
    actorUid,
    targetUid: uid,
    action: `wallet_${status}`,
    collection: 'wallets',
    recordId: walletId,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function createApprovalRequest(input: {
  action: string;
  targetUid: string;
  targetPath?: string;
  amount?: number;
  payload?: Record<string, any>;
  requestedBy: string;
}) {
  ensureDb();
  await addDoc(collection(db!, 'adminApprovalRequests'), {
    ...input,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function reviewApprovalRequest(request: AdminApprovalRequest, status: 'approved' | 'rejected', reviewedBy: string) {
  ensureDb();
  if (request.requestedBy === reviewedBy) {
    throw new Error('Maker-checker requires a different admin reviewer.');
  }

  await runTransaction(db!, async (transaction) => {
    const requestRef = doc(db!, 'adminApprovalRequests', request.id);
    const requestSnapshot = await transaction.get(requestRef);
    if (!requestSnapshot.exists()) throw new Error('Approval request no longer exists.');
    if (requestSnapshot.data().status !== 'pending') throw new Error('Approval request is no longer pending.');
    transaction.update(requestRef, {
      status,
      reviewedBy,
      reviewedAt: serverTimestamp(),
    });
    transaction.set(doc(collection(db!, 'adminAuditLogs')), {
      actorUid: reviewedBy,
      targetUid: request.targetUid,
      action: `approval_${status}_${request.action}`,
      collection: 'adminApprovalRequests',
      recordId: request.id,
      amount: request.amount,
      createdAt: serverTimestamp(),
    });
  });
}


export async function distributeGlobalProfit(ratePercent: number, actorUid: string) {
  ensureDb();
  if (!Number.isFinite(ratePercent) || ratePercent <= 0) {
    throw new Error('Rate must be greater than zero.');
  }

  // Query all investments that are active using collectionGroup
  const investmentsSnapshot = await getDocs(
    query(collectionGroup(db!, 'investments'), where('status', '==', 'active'))
  );
  
  const activeInvestments = investmentsSnapshot.docs.map(d => {
    const parentPath = d.ref.parent.parent;
    if (!parentPath) throw new Error('Parent user path not found');
    return {
      id: d.id,
      uid: parentPath.id,
      ...d.data()
    } as AdminRecord<Investment>;
  });

  if (activeInvestments.length === 0) {
    throw new Error('No active investments found to distribute profit.');
  }

  // Split into chunks of 100 for Firestore batch size limits (safety margin)
  const chunkSize = 100;
  for (let i = 0; i < activeInvestments.length; i += chunkSize) {
    const chunk = activeInvestments.slice(i, i + chunkSize);
    const batch = writeBatch(db!);

    for (const inv of chunk) {
      const profit = Number((Number(inv.amount || 0) * (ratePercent / 100)).toFixed(2));
      if (profit <= 0) continue;

      const userRef = doc(db!, 'users', inv.uid);
      const investmentRef = doc(db!, 'users', inv.uid, 'investments', inv.id);

      batch.update(investmentRef, {
        profitAvailable: increment(profit),
        profitTotal: increment(profit),
        updatedAt: serverTimestamp(),
      });

      batch.update(userRef, {
        'totals.todayProfit': increment(profit),
        'totals.totalEarned': increment(profit),
        'totals.withdrawableProfit': increment(profit),
        updatedAt: serverTimestamp(),
      });

      // Audit logs
      const auditLogRef = doc(collection(db!, 'adminAuditLogs'));
      batch.set(auditLogRef, {
        actorUid,
        targetUid: inv.uid,
        action: 'global_profit_distribute',
        collection: 'investments',
        recordId: inv.id,
        amount: profit,
        ratePercent,
        createdAt: serverTimestamp(),
      });

      // Ledger entries
      const ledgerRef = doc(collection(db!, 'ledgerEntries'));
      batch.set(ledgerRef, {
        uid: inv.uid,
        type: 'profit_added',
        amount: profit,
        status: 'credited',
        refId: inv.id,
        refPath: `users/${inv.uid}/investments/${inv.id}`,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }
}

function ensureDb() {
  if (!db) {
    throw new Error('Database service is not configured.');
  }
}

function sortByCreatedAtDesc<T extends { createdAt?: { toMillis?: () => number } }>(items: T[]) {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });
}
