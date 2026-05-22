import admin from "firebase-admin";
import { adminAuth, adminDb } from "./_services/firebaseAdmin.js";
import {
  assertApprovedWallet,
  computeWithdrawalFee,
  createApiError,
  getPendingWithdrawalTotals,
  normalizeBep20Address,
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
  } catch (err: any) {
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }
  const uid = decodedToken.uid;

  const { investmentId, walletAddress, speed } = req.body || {};
  let normalizedWallet: string;
  try {
    if (!investmentId || typeof investmentId !== "string") {
      throw createApiError("Investment ID is required.");
    }
    normalizedWallet = normalizeBep20Address(walletAddress);
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
      const investmentRef = adminDb.collection("users").doc(uid).collection("investments").doc(investmentId);

      const userSnap = await transaction.get(userRef);
      const invSnap = await transaction.get(investmentRef);
      await assertApprovedWallet(transaction, uid, normalizedWallet);
      const pendingTotals = await getPendingWithdrawalTotals(transaction, uid);

      if (!userSnap.exists) throw createApiError("User record not found.", 404);
      if (!invSnap.exists) throw createApiError("Investment record not found.", 404);

      const userData = userSnap.data();
      const invData = invSnap.data();
      if (invData?.status !== "active") {
        throw createApiError("Investment portfolio is not active.");
      }

      const pendingForInvestment = pendingTotals.byInvestment.get(investmentId) || 0;
      if (pendingForInvestment > 0) {
        throw createApiError("This portfolio already has a pending withdrawal. Resolve it before settlement.");
      }

      const availableProfit = roundMoney(Number(invData?.profitAvailable || 0) - pendingForInvestment);
      const availableUserProfit = roundMoney(Number(userData?.totals?.withdrawableProfit || 0) - pendingTotals.userTotal);
      if (availableProfit < 50) {
        throw createApiError("Minimum settlement profit is $50.00");
      }
      if (availableUserProfit < availableProfit) {
        throw createApiError("Pending withdrawals reduce your available settlement balance.");
      }

      const computedFee = computeWithdrawalFee(availableProfit, speed);

      // Set investment status to pending_settlement
      transaction.update(investmentRef, {
        status: "pending_settlement",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const withdrawalRef = adminDb.collection("users").doc(uid).collection("withdrawals").doc();
      transaction.set(withdrawalRef, {
        amount: availableProfit,
        walletAddress: normalizedWallet,
        investmentId,
        method: "usdt_bep20",
        type: "settlement",
        speed,
        fee: computedFee,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const ledgerRef = adminDb.collection("ledgerEntries").doc();
      transaction.set(ledgerRef, {
        uid,
        type: "settlement_requested",
        amount: availableProfit,
        status: "pending",
        refId: withdrawalRef.id,
        refPath: `users/${uid}/withdrawals/${withdrawalRef.id}`,
        metadata: { walletAddress: normalizedWallet, investmentId, speed, fee: computedFee },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      returnVal = {
        withdrawalId: withdrawalRef.id,
        amount: availableProfit,
        fee: computedFee
      };
    });

    return res.status(200).json({ ok: true, data: returnVal });
  } catch (error: any) {
    console.error("Settlement API error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Settlement failed." });
  }
}
