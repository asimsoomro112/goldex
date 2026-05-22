import { adminDb } from "./firebaseAdmin.js";

export const MIN_WITHDRAWAL_AMOUNT = 50;
const BEP20_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function createApiError(message: string, statusCode = 400) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseMoneyAmount(value: unknown, label: string, minAmount = 0) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < minAmount) {
    throw createApiError(`${label} must be at least $${minAmount.toFixed(2)}.`);
  }
  return roundMoney(amount);
}

export function normalizeBep20Address(value: unknown) {
  const address = String(value || "").trim();
  if (!BEP20_ADDRESS_RE.test(address)) {
    throw createApiError("Enter a valid USDT BEP20 wallet address.");
  }
  return address;
}

export function computeWithdrawalFee(amount: number, speed: "standard" | "express") {
  return roundMoney(amount * (speed === "express" ? 0.12 : 0.08));
}

export function getTierRatesForAmount(amount: number) {
  if (amount >= 5000) return { min: 0.012, max: 0.015 };
  if (amount >= 500) return { min: 0.01, max: 0.012 };
  return { min: 0.005, max: 0.01 };
}

export async function assertApprovedWallet(transaction: any, uid: string, walletAddress: string) {
  const normalized = normalizeBep20Address(walletAddress);
  const walletsRef = adminDb.collection("users").doc(uid).collection("wallets");
  const walletSnapshot = await transaction.get(walletsRef.where("status", "==", "approved"));
  const approved = walletSnapshot.docs.some((walletDoc: any) => {
    const savedAddress = String(walletDoc.data()?.address || "").trim().toLowerCase();
    return savedAddress === normalized.toLowerCase();
  });

  if (!approved) {
    throw createApiError("Wallet must be approved in Settings before withdrawal.");
  }

  return normalized;
}

export async function getPendingWithdrawalTotals(transaction: any, uid: string) {
  const withdrawalsRef = adminDb.collection("users").doc(uid).collection("withdrawals");
  const pendingSnapshot = await transaction.get(withdrawalsRef.where("status", "==", "pending"));
  const byInvestment = new Map<string, number>();
  let userTotal = 0;

  pendingSnapshot.docs.forEach((withdrawalDoc: any) => {
    const data = withdrawalDoc.data();
    const amount = Number(data?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return;

    userTotal += amount;
    const investmentId = typeof data?.investmentId === "string" ? data.investmentId : "";
    if (investmentId) {
      byInvestment.set(investmentId, roundMoney((byInvestment.get(investmentId) || 0) + amount));
    }
  });

  return {
    userTotal: roundMoney(userTotal),
    byInvestment,
  };
}
