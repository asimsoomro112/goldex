import admin from "firebase-admin";
import { adminAuth, adminDb } from "./_services/firebaseAdmin.js";
import {
  createApiError,
  getPendingWithdrawalTotals,
  getTierRatesForAmount,
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
  } catch (err: any) {
    return res.status(401).json({ error: "Unauthorized: Invalid token." });
  }
  const uid = decodedToken.uid;

  const { amount, sourceInvestmentId, targetInvestmentId } = req.body || {};
  let numericAmount: number;
  try {
    numericAmount = parseMoneyAmount(amount, "Reinvestment amount", 50);
    if (!sourceInvestmentId || typeof sourceInvestmentId !== "string") {
      throw createApiError("Source investment ID is required.");
    }
    if (targetInvestmentId && typeof targetInvestmentId !== "string") {
      throw createApiError("Target investment ID is invalid.");
    }
  } catch (error: any) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(uid);
      const sourceInvRef = adminDb.collection("users").doc(uid).collection("investments").doc(sourceInvestmentId);
      const targetInvRef = targetInvestmentId
        ? adminDb.collection("users").doc(uid).collection("investments").doc(targetInvestmentId)
        : null;

      const userSnap = await transaction.get(userRef);
      const sourceInvSnap = await transaction.get(sourceInvRef);
      const targetInvSnap = targetInvRef
        ? targetInvestmentId === sourceInvestmentId
          ? sourceInvSnap
          : await transaction.get(targetInvRef)
        : null;
      const pendingTotals = await getPendingWithdrawalTotals(transaction, uid);

      if (!userSnap.exists) throw createApiError("User record not found.", 404);
      if (!sourceInvSnap.exists) throw createApiError("Source investment record not found.", 404);

      const userData = userSnap.data();
      const sourceInvData = sourceInvSnap.data();
      if (sourceInvData?.status !== "active") {
        throw createApiError("Source investment portfolio is not active.");
      }

      const currentWithdrawable = Number(userData?.totals?.withdrawableProfit || 0);
      const currentSourceProfit = Number(sourceInvData?.profitAvailable || 0);
      const available = roundMoney(currentWithdrawable - pendingTotals.userTotal);
      const pendingForSource = pendingTotals.byInvestment.get(sourceInvestmentId) || 0;
      const sourceInvAvailable = roundMoney(currentSourceProfit - pendingForSource);

      if (available < numericAmount || sourceInvAvailable < numericAmount) {
        throw createApiError("Insufficient profit available after pending withdrawals.");
      }

      const bonusAmount = roundMoney(numericAmount * 1.05); // 5% bonus

      // Deduct from source investment & user totals
      const newWithdrawable = roundMoney(currentWithdrawable - numericAmount);
      const newLockedPrincipal = roundMoney(Number(userData?.totals?.lockedPrincipal || 0) + bonusAmount);

      transaction.update(userRef, {
        "totals.withdrawableProfit": newWithdrawable,
        "totals.lockedPrincipal": newLockedPrincipal,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.update(sourceInvRef, {
        profitAvailable: roundMoney(currentSourceProfit - numericAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      let activeInvId = "";
      if (targetInvestmentId) {
        // Top up existing investment
        if (!targetInvSnap?.exists) throw createApiError("Target investment portfolio not found.", 404);

        const targetInvData = targetInvSnap.data();
        if (targetInvData?.status !== "active") {
          throw createApiError("Target investment portfolio is not active.");
        }
        const currentAmount = Number(targetInvData?.amount || 0);
        const newAmount = roundMoney(currentAmount + bonusAmount);
        const tierRates = getTierRatesForAmount(newAmount);
        transaction.update(targetInvRef!, {
          amount: newAmount,
          dailyRateMin: tierRates.min,
          dailyRateMax: tierRates.max,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        activeInvId = targetInvestmentId;
      } else {
        // Create new investment portfolio (active immediately)
        const tierRates = getTierRatesForAmount(bonusAmount);

        const newInvRef = adminDb.collection("users").doc(uid).collection("investments").doc();
        transaction.set(newInvRef, {
          amount: bonusAmount,
          method: "usdt_bep20",
          status: "active",
          dailyRateMin: tierRates.min,
          dailyRateMax: tierRates.max,
          profitAvailable: 0,
          profitTotal: 0,
          depositAddress: "Internal Reinvestment",
          txHash: "reinvestment",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        activeInvId = newInvRef.id;
      }

      // Add ledger entry
      const ledgerRef = adminDb.collection("ledgerEntries").doc();
      transaction.set(ledgerRef, {
        uid,
        type: "reinvestment",
        amount: numericAmount,
        bonus: parseFloat((numericAmount * 0.05).toFixed(2)),
        status: "completed",
        refId: activeInvId,
        refPath: `users/${uid}/investments/${activeInvId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Reinvestment API error:", error);
    return res.status(error.statusCode || 500).json({ error: error.message || "Reinvestment failed." });
  }
}
