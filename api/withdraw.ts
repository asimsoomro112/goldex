import admin from "firebase-admin";
import { adminAuth, adminDb } from "./_services/firebaseAdmin.js";
import {
  MIN_WITHDRAWAL_AMOUNT,
  assertApprovedWallet,
  computeWithdrawalFee,
  createApiError,
  getPendingWithdrawalTotals,
  normalizeBep20Address,
  parseMoneyAmount,
  roundMoney,
} from "./_services/financeGuards.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const authHeader = req.headers?.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token format." });
  }

  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
  } catch (_err: any) {
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }

  const uid = decodedToken.uid;
  const { amount, walletAddress, investmentId, speed } = req.body || {};

  let numericAmount: number;
  let normalizedWallet: string;
  try {
    numericAmount = parseMoneyAmount(amount, "Withdrawal amount", MIN_WITHDRAWAL_AMOUNT);
    normalizedWallet = normalizeBep20Address(walletAddress);
    if (!investmentId || typeof investmentId !== "string") {
      throw createApiError("Investment ID is required.");
    }
    if (speed !== "standard" && speed !== "express") {
      throw createApiError("Invalid speed type. Must be 'standard' or 'express'.");
    }
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }

  try {
    let returnVal: any = null;

    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(uid);
      const investmentRef = userRef.collection("investments").doc(investmentId);

      const userSnap = await transaction.get(userRef);
      const investmentSnap = await transaction.get(investmentRef);
      await assertApprovedWallet(transaction, uid, normalizedWallet);
      const pendingTotals = await getPendingWithdrawalTotals(transaction, uid);

      if (!userSnap.exists) throw createApiError("User record not found.", 404);
      if (!investmentSnap.exists) throw createApiError("Investment record not found.", 404);

      const userData = userSnap.data();
      const investmentData = investmentSnap.data();
      if (investmentData?.status !== "active") {
        throw createApiError("Investment portfolio is not active.");
      }

      const availableUserProfit = roundMoney(Number(userData?.totals?.withdrawableProfit || 0) - pendingTotals.userTotal);
      const pendingForInvestment = pendingTotals.byInvestment.get(investmentId) || 0;
      const availableInvestmentProfit = roundMoney(Number(investmentData?.profitAvailable || 0) - pendingForInvestment);

      if (numericAmount > availableUserProfit) {
        throw createApiError("Insufficient live profit after pending withdrawals.");
      }
      if (numericAmount > availableInvestmentProfit) {
        throw createApiError("Amount is higher than this investment's remaining available profit.");
      }

      const fee = computeWithdrawalFee(numericAmount, speed);
      const withdrawalRef = userRef.collection("withdrawals").doc();

      transaction.set(withdrawalRef, {
        amount: numericAmount,
        walletAddress: normalizedWallet,
        investmentId,
        method: "usdt_bep20",
        type: "standard",
        speed,
        fee,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const ledgerRef = adminDb.collection("ledgerEntries").doc();
      transaction.set(ledgerRef, {
        uid,
        type: "withdrawal_requested",
        amount: numericAmount,
        status: "pending",
        refId: withdrawalRef.id,
        refPath: `users/${uid}/withdrawals/${withdrawalRef.id}`,
        metadata: { walletAddress: normalizedWallet, investmentId, speed, fee },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      returnVal = { withdrawalId: withdrawalRef.id, amount: numericAmount, fee };
    });

    return res.status(200).json({ ok: true, data: returnVal });
  } catch (error: any) {
    console.error("Withdrawal API error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Withdrawal failed." });
  }
}
