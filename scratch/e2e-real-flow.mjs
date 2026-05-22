import fs from "node:fs";
import crypto from "node:crypto";
import admin from "firebase-admin";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD_jl0QfkP7_ujvMmMmsol4oe3RUu0HGnc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "goldex-c4347.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "goldex-c4347",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "goldex-c4347.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "829299296738",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:829299296738:web:4c8f11be20d571edbbd1bb",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LCXXBLH8FJ",
};

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "firebase-service-account.json";
const amount = Number(process.env.E2E_AMOUNT || 50);
const profit = Number(process.env.E2E_PROFIT || 50);
const walletAddress = process.env.E2E_WALLET_ADDRESS || "0x1111111111111111111111111111111111111111";
const depositAddress = process.env.VITE_USDT_BEP20_ADDRESS || "0x2222222222222222222222222222222222222222";
const keepData = process.env.KEEP_E2E_DATA === "1";
const actorUid = "codex-e2e-admin";

const runId = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
const email = `codex-e2e-${runId}@example.com`;
const password = `Codex-${crypto.randomBytes(8).toString("hex")}!1`;
const displayName = "Codex E2E Test User";
const referralCode = `GX${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
const depositId = `codexDeposit${runId}`;
const investmentId = `codexInvestment${runId}`;
const walletId = `codexWallet${runId}`;
const withdrawalId = `codexWithdrawal${runId}`;
const txHash = `0x${crypto.randomBytes(32).toString("hex")}`;
const payoutTxHash = `0x${crypto.randomBytes(32).toString("hex")}`;

const steps = [];
let uid = null;
let hadFailure = false;

function logStep(name, status, detail = "") {
  steps.push({ name, status, detail });
  if (status === "FAIL") hadFailure = true;
  const suffix = detail ? ` - ${detail}` : "";
  console.log(`${status === "PASS" ? "PASS" : status === "SKIP" ? "SKIP" : "FAIL"} ${name}${suffix}`);
}

function value(input) {
  if (input === null || input === undefined) return { nullValue: null };
  if (typeof input === "string") return { stringValue: input };
  if (typeof input === "number") return Number.isInteger(input) ? { integerValue: String(input) } : { doubleValue: input };
  if (typeof input === "boolean") return { booleanValue: input };
  if (input instanceof Date) return { timestampValue: input.toISOString() };
  if (Array.isArray(input)) return { arrayValue: { values: input.map(value) } };
  if (typeof input === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(input).map(([key, val]) => [key, value(val)])),
      },
    };
  }
  return { stringValue: String(input) };
}

function docName(path) {
  return `projects/${firebaseConfig.projectId}/databases/(default)/documents/${path}`;
}

function updateWrite(path, data) {
  return {
    update: {
      name: docName(path),
      fields: Object.fromEntries(Object.entries(data).map(([key, val]) => [key, value(val)])),
    },
  };
}

async function firestoreCommit(idToken, writes) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents:commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || response.statusText;
    const code = body?.error?.status || response.status;
    throw new Error(`${code}: ${message}`);
  }
  return body;
}

async function signUp() {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error?.message || response.statusText);
  }
  return { idToken: body.idToken, uid: body.localId };
}

function initAdmin() {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Missing service account file: ${serviceAccountPath}`);
  }
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });
  }
  return {
    auth: admin.auth(),
    db: admin.firestore(),
    FieldValue: admin.firestore.FieldValue,
  };
}

async function createUserDocument(idToken) {
  const now = new Date();
  await firestoreCommit(idToken, [
    updateWrite(`users/${uid}`, {
      uid,
      displayName,
      email,
      photoURL: null,
      referralCode,
      referredBy: null,
      referralStatus: null,
      referralCommissionPaid: 0,
      refereeBonusPaid: 0,
      role: "user",
      kycStatus: "not_started",
      accountStatus: "active",
      emailVerifiedAt: null,
      totals: {
        lockedPrincipal: 0,
        todayProfit: 0,
        totalEarned: 0,
        withdrawableProfit: 0,
      },
      createdAt: now,
      updatedAt: now,
    }),
  ]);
}

async function forceCreateUserDocument(db, FieldValue) {
  await db.doc(`users/${uid}`).set({
    uid,
    displayName,
    email,
    photoURL: null,
    referralCode,
    referredBy: null,
    referralStatus: null,
    referralCommissionPaid: 0,
    refereeBonusPaid: 0,
    role: "user",
    kycStatus: "not_started",
    accountStatus: "active",
    emailVerifiedAt: null,
    totals: {
      lockedPrincipal: 0,
      todayProfit: 0,
      totalEarned: 0,
      withdrawableProfit: 0,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function createDepositRequest(idToken) {
  const now = new Date();
  await firestoreCommit(idToken, [
    updateWrite(`users/${uid}/deposits/${depositId}`, {
      amount,
      method: "usdt_bep20",
      depositAddress,
      investmentId,
      txHash,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }),
    updateWrite(`users/${uid}/investments/${investmentId}`, {
      amount,
      method: "usdt_bep20",
      status: "pending_deposit",
      dailyRateMin: 0.005,
      dailyRateMax: 0.01,
      profitAvailable: 0,
      profitTotal: 0,
      depositAddress,
      txHash,
      createdAt: now,
      updatedAt: now,
    }),
    updateWrite(`depositTxHashes/${txHash}`, {
      uid,
      txHash,
      amount,
      status: "pending",
      refPath: `users/${uid}/deposits/${depositId}`,
      createdAt: now,
      updatedAt: now,
    }),
    updateWrite(`ledgerEntries/codexDepositLedger${runId}`, {
      uid,
      type: "deposit_created",
      amount,
      status: "pending",
      refId: depositId,
      refPath: `users/${uid}/deposits/${depositId}`,
      txHash,
      createdAt: now,
    }),
  ]);
}

async function assertDuplicateDepositRejected(idToken) {
  const now = new Date();
  const duplicateDepositId = `codexDuplicateDeposit${runId}`;
  const duplicateInvestmentId = `codexDuplicateInvestment${runId}`;

  try {
    await firestoreCommit(idToken, [
      updateWrite(`users/${uid}/deposits/${duplicateDepositId}`, {
        amount,
        method: "usdt_bep20",
        depositAddress,
        investmentId: duplicateInvestmentId,
        txHash,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      }),
      updateWrite(`users/${uid}/investments/${duplicateInvestmentId}`, {
        amount,
        method: "usdt_bep20",
        status: "pending_deposit",
        dailyRateMin: 0.005,
        dailyRateMax: 0.01,
        profitAvailable: 0,
        profitTotal: 0,
        depositAddress,
        txHash,
        createdAt: now,
        updatedAt: now,
      }),
      updateWrite(`depositTxHashes/${txHash}`, {
        uid,
        txHash,
        amount,
        status: "pending",
        refPath: `users/${uid}/deposits/${duplicateDepositId}`,
        createdAt: now,
        updatedAt: now,
      }),
    ]);
  } catch (error) {
    if (String(error.message).includes("PERMISSION_DENIED")) return;
    throw error;
  }

  throw new Error("Duplicate deposit transaction hash was accepted.");
}

async function approveDepositAndAddProfit(db, FieldValue) {
  const now = FieldValue.serverTimestamp();
  await db.runTransaction(async (transaction) => {
    const userRef = db.doc(`users/${uid}`);
    const depositRef = db.doc(`users/${uid}/deposits/${depositId}`);
    const investmentRef = db.doc(`users/${uid}/investments/${investmentId}`);

    const depositSnap = await transaction.get(depositRef);
    const investmentSnap = await transaction.get(investmentRef);
    if (!depositSnap.exists) throw new Error("Deposit record missing before approval.");
    if (!investmentSnap.exists) throw new Error("Investment record missing before approval.");
    if (depositSnap.data().status !== "pending") throw new Error("Deposit is not pending.");
    if (investmentSnap.data().status !== "pending_deposit") throw new Error("Investment is not pending_deposit.");

    transaction.update(depositRef, { status: "verified", updatedAt: now });
    transaction.update(investmentRef, {
      status: "active",
      activatedAt: now,
      profitAvailable: FieldValue.increment(profit),
      profitTotal: FieldValue.increment(profit),
      updatedAt: now,
    });
    transaction.update(userRef, {
      "totals.lockedPrincipal": FieldValue.increment(amount),
      "totals.todayProfit": FieldValue.increment(profit),
      "totals.totalEarned": FieldValue.increment(profit),
      "totals.withdrawableProfit": FieldValue.increment(profit),
      updatedAt: now,
    });
    transaction.set(db.doc(`depositTxHashes/${txHash}`), {
      uid,
      txHash,
      amount,
      status: "verified",
      refPath: `users/${uid}/deposits/${depositId}`,
      verifiedAt: now,
      updatedAt: now,
    }, { merge: true });
    transaction.set(db.collection("ledgerEntries").doc(`codexProfitLedger${runId}`), {
      uid,
      type: "profit_added",
      amount: profit,
      status: "credited",
      refId: investmentId,
      refPath: `users/${uid}/investments/${investmentId}`,
      createdAt: now,
    });
    transaction.set(db.collection("adminAuditLogs").doc(`codexApproveAudit${runId}`), {
      actorUid,
      targetUid: uid,
      action: "codex_e2e_deposit_approved_and_profit_added",
      collection: "investments",
      recordId: investmentId,
      amount: amount + profit,
      createdAt: now,
    });
  });
}

async function createWalletRequest(idToken) {
  const now = new Date();
  await firestoreCommit(idToken, [
    updateWrite(`users/${uid}/wallets/${walletId}`, {
      address: walletAddress,
      label: "Codex E2E BEP20 wallet",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }),
    updateWrite(`ledgerEntries/codexWalletLedger${runId}`, {
      uid,
      type: "wallet_submitted",
      status: "pending",
      refId: walletId,
      refPath: `users/${uid}/wallets/${walletId}`,
      metadata: { address: walletAddress, label: "Codex E2E BEP20 wallet" },
      createdAt: now,
    }),
  ]);
}

async function approveWallet(db, FieldValue) {
  await db.doc(`users/${uid}/wallets/${walletId}`).update({
    status: "approved",
    reviewedBy: actorUid,
    reviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

async function createWithdrawalRequest(idToken) {
  const now = new Date();
  await firestoreCommit(idToken, [
    updateWrite(`users/${uid}/withdrawals/${withdrawalId}`, {
      amount: profit,
      walletAddress,
      investmentId,
      method: "usdt_bep20",
      type: "standard",
      speed: "standard",
      fee: 0,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }),
    updateWrite(`ledgerEntries/codexWithdrawalLedger${runId}`, {
      uid,
      type: "withdrawal_requested",
      amount: profit,
      status: "pending",
      refId: withdrawalId,
      refPath: `users/${uid}/withdrawals/${withdrawalId}`,
      metadata: { walletAddress, investmentId, speed: "standard", fee: 0 },
      createdAt: now,
    }),
  ]);
}

async function markWithdrawalPaid(db, FieldValue) {
  await db.runTransaction(async (transaction) => {
    const userRef = db.doc(`users/${uid}`);
    const withdrawalRef = db.doc(`users/${uid}/withdrawals/${withdrawalId}`);
    const investmentRef = db.doc(`users/${uid}/investments/${investmentId}`);
    const userSnap = await transaction.get(userRef);
    const withdrawalSnap = await transaction.get(withdrawalRef);
    const investmentSnap = await transaction.get(investmentRef);

    if (!userSnap.exists) throw new Error("User record missing before payout.");
    if (!withdrawalSnap.exists) throw new Error("Withdrawal record missing before payout.");
    if (!investmentSnap.exists) throw new Error("Investment record missing before payout.");
    if (withdrawalSnap.data().status !== "pending") throw new Error("Withdrawal is not pending.");

    const available = Number(userSnap.data()?.totals?.withdrawableProfit || 0);
    const investmentProfit = Number(investmentSnap.data()?.profitAvailable || 0);
    if (available < profit) throw new Error(`User withdrawableProfit ${available} is less than ${profit}.`);
    if (investmentProfit < profit) throw new Error(`Investment profitAvailable ${investmentProfit} is less than ${profit}.`);

    transaction.update(withdrawalRef, {
      status: "paid",
      payoutTxHash,
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(userRef, {
      "totals.withdrawableProfit": FieldValue.increment(-profit),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(investmentRef, {
      profitAvailable: FieldValue.increment(-profit),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(db.collection("ledgerEntries").doc(`codexWithdrawalPaidLedger${runId}`), {
      uid,
      type: "withdrawal_paid",
      amount: profit,
      status: "paid",
      refId: withdrawalId,
      refPath: `users/${uid}/withdrawals/${withdrawalId}`,
      txHash: payoutTxHash,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.set(db.collection("adminAuditLogs").doc(`codexWithdrawalPaidAudit${runId}`), {
      actorUid,
      targetUid: uid,
      action: "codex_e2e_withdrawal_paid",
      collection: "withdrawals",
      recordId: withdrawalId,
      amount: profit,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}

async function assertFinalState(db) {
  const [userSnap, investmentSnap, withdrawalSnap] = await Promise.all([
    db.doc(`users/${uid}`).get(),
    db.doc(`users/${uid}/investments/${investmentId}`).get(),
    db.doc(`users/${uid}/withdrawals/${withdrawalId}`).get(),
  ]);

  const user = userSnap.data();
  const investment = investmentSnap.data();
  const withdrawal = withdrawalSnap.data();
  const failures = [];

  if (user?.totals?.lockedPrincipal !== amount) failures.push(`lockedPrincipal=${user?.totals?.lockedPrincipal}`);
  if (user?.totals?.withdrawableProfit !== 0) failures.push(`withdrawableProfit=${user?.totals?.withdrawableProfit}`);
  if (investment?.status !== "active") failures.push(`investment.status=${investment?.status}`);
  if (investment?.profitAvailable !== 0) failures.push(`investment.profitAvailable=${investment?.profitAvailable}`);
  if (investment?.profitTotal !== profit) failures.push(`investment.profitTotal=${investment?.profitTotal}`);
  if (withdrawal?.status !== "paid") failures.push(`withdrawal.status=${withdrawal?.status}`);

  if (failures.length) {
    throw new Error(`Final state mismatch: ${failures.join(", ")}`);
  }
}

async function cleanup(auth, db) {
  if (!uid || keepData) return;

  const batchDeletes = [];
  for (const collectionName of ["deposits", "investments", "withdrawals", "wallets"]) {
    const snapshot = await db.collection(`users/${uid}/${collectionName}`).get();
    snapshot.docs.forEach((doc) => batchDeletes.push(doc.ref.delete()));
  }
  const ledgerSnapshot = await db.collection("ledgerEntries").where("uid", "==", uid).get();
  ledgerSnapshot.docs.forEach((doc) => batchDeletes.push(doc.ref.delete()));
  const auditSnapshot = await db.collection("adminAuditLogs").where("targetUid", "==", uid).get();
  auditSnapshot.docs.forEach((doc) => batchDeletes.push(doc.ref.delete()));
  const txHashSnapshot = await db.collection("depositTxHashes").where("uid", "==", uid).get();
  txHashSnapshot.docs.forEach((doc) => batchDeletes.push(doc.ref.delete()));
  batchDeletes.push(db.doc(`users/${uid}`).delete());
  await Promise.allSettled(batchDeletes);

  try {
    await auth.deleteUser(uid);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }
}

async function main() {
  const { auth, db, FieldValue } = initAdmin();
  console.log(`Project: ${firebaseConfig.projectId}`);
  console.log(`Test email: ${email}`);
  console.log(`Run ID: ${runId}`);

  try {
    const signup = await signUp();
    uid = signup.uid;
    logStep("client auth signup", "PASS", uid);

    try {
      await createUserDocument(signup.idToken);
      logStep("client user profile create through Firestore rules", "PASS");
    } catch (error) {
      logStep("client user profile create through Firestore rules", "FAIL", error.message);
      await forceCreateUserDocument(db, FieldValue);
      logStep("admin forced test profile so downstream flow can be checked", "PASS");
    }

    await createDepositRequest(signup.idToken);
    logStep("client first deposit request through Firestore rules", "PASS", txHash);

    await assertDuplicateDepositRejected(signup.idToken);
    logStep("duplicate deposit tx hash rejected by Firestore rules", "PASS");

    await approveDepositAndAddProfit(db, FieldValue);
    logStep("admin approve deposit and credit first profit", "PASS", `$${profit}`);

    await createWalletRequest(signup.idToken);
    logStep("client wallet whitelist request through Firestore rules", "PASS");

    await approveWallet(db, FieldValue);
    logStep("admin approve payout wallet", "PASS", walletAddress);

    try {
      await createWithdrawalRequest(signup.idToken);
      logStep("client first withdrawal request through Firestore rules", "PASS");
    } catch (error) {
      logStep("client first withdrawal request through Firestore rules", "FAIL", error.message);
      throw error;
    }

    await markWithdrawalPaid(db, FieldValue);
    logStep("admin mark withdrawal paid and reconcile balances", "PASS", payoutTxHash);

    await assertFinalState(db);
    logStep("final ledger/balance state", "PASS", "locked=$50, withdrawable=$0, withdrawal=paid");
  } catch (error) {
    if (!steps.some((step) => step.name === "e2e flow" && step.status === "FAIL")) {
      logStep("e2e flow", "FAIL", error.message);
    }
    process.exitCode = 1;
  } finally {
    try {
      await cleanup(auth, db);
      if (uid && !keepData) logStep("cleanup test user/data", "PASS", uid);
      if (uid && keepData) logStep("cleanup test user/data", "SKIP", `KEEP_E2E_DATA=1 uid=${uid}`);
    } catch (error) {
      logStep("cleanup test user/data", "FAIL", error.message);
      process.exitCode = 1;
    }
    console.log("\nSummary:");
    console.table(steps);
    if (hadFailure) process.exitCode = 1;
  }
}

main();
