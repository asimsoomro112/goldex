import admin from "firebase-admin";
import { adminAuth, adminDb } from "../src/server/firebaseAdmin";

async function seedUser() {
  console.log("Starting user seeding process...");

  const email = "alisammar875@gmail.com";
  const password = "alisammar123";
  const displayName = "Ali Sammar";
  const referralCode = "GXALISAMMAR";

  // Timeline dates
  const registerDate = new Date("2026-03-24T12:00:00Z");
  const depositDate = new Date("2026-03-25T12:00:00Z");
  const withdrawalDate = new Date("2026-05-15T12:00:00Z");
  const todayDate = new Date("2026-05-23T12:00:00Z");

  let uid: string;

  // 1. Check if user already exists in Firebase Auth, delete if so, then create
  try {
    const existingUser = await adminAuth.getUserByEmail(email);
    console.log(`User ${email} already exists with UID ${existingUser.uid}. Deleting first...`);
    
    // Delete Firestore collections first
    uid = existingUser.uid;
    const collections = ["deposits", "investments", "withdrawals", "wallets"];
    for (const coll of collections) {
      const snap = await adminDb.collection("users").doc(uid).collection(coll).get();
      const batch = adminDb.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted subcollection: ${coll}`);
    }

    // Delete ledger entries, audit logs, deposit hashes
    const ledgersSnap = await adminDb.collection("ledgerEntries").where("uid", "==", uid).get();
    const ledgerBatch = adminDb.batch();
    ledgersSnap.docs.forEach((doc) => ledgerBatch.delete(doc.ref));
    await ledgerBatch.commit();

    const auditSnap = await adminDb.collection("adminAuditLogs").where("targetUid", "==", uid).get();
    const auditBatch = adminDb.batch();
    auditSnap.docs.forEach((doc) => auditBatch.delete(doc.ref));
    await auditBatch.commit();

    const txSnap = await adminDb.collection("depositTxHashes").where("uid", "==", uid).get();
    const txBatch = adminDb.batch();
    txSnap.docs.forEach((doc) => txBatch.delete(doc.ref));
    await txBatch.commit();

    // Delete user doc
    await adminDb.collection("users").doc(uid).delete();
    console.log(`Deleted user Firestore document for UID ${uid}`);

    // Delete auth user
    await adminAuth.deleteUser(uid);
    console.log("Deleted user from Firebase Auth.");
  } catch (error: any) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  // 2. Create user in Firebase Auth
  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName,
    emailVerified: true,
  });
  uid = userRecord.uid;
  console.log(`Successfully created Auth user with UID: ${uid}`);

  // 3. Generate daily profits over 2 months (from 2026-03-26 to 2026-05-23)
  const startProfitDate = new Date("2026-03-26T12:00:00Z");
  const endProfitDate = new Date("2026-05-23T12:00:00Z");
  
  let currentDate = new Date(startProfitDate);
  let totalProfit = 0;
  const profitLedgerWrites: any[] = [];
  const investmentId = "GXINV" + Math.random().toString(36).substring(2, 10).toUpperCase();

  // Generate daily rates between 0.8% and 0.9% for consistency
  while (currentDate <= endProfitDate) {
    const rate = 0.008 + (Math.random() * 0.001); // 0.8% to 0.9%
    const dailyProfit = Number((100 * rate).toFixed(2));
    totalProfit = Number((totalProfit + dailyProfit).toFixed(2));

    profitLedgerWrites.push({
      uid,
      type: "profit_added",
      amount: dailyProfit,
      status: "credited",
      refId: investmentId,
      refPath: `users/${uid}/investments/${investmentId}`,
      createdAt: admin.firestore.Timestamp.fromDate(new Date(currentDate)),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  const withdrawAmount = 40.00;
  const withdrawableProfit = Number((totalProfit - withdrawAmount).toFixed(2));
  const todayProfit = profitLedgerWrites[profitLedgerWrites.length - 1].amount;

  console.log(`Generated daily profits. Total profit: $${totalProfit}. Withdrawn: $${withdrawAmount}. Net Withdrawable: $${withdrawableProfit}`);

  // 4. Create Firestore User Profile Document
  await adminDb.collection("users").doc(uid).set({
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
    kycStatus: "verified",
    kycLegalName: displayName,
    kycCountry: "Pakistan",
    kycDocumentType: "id_card",
    kycDocumentNumber: "42101-1234567-1",
    kycDob: "1995-05-15",
    kycExpiryDate: "2030-05-15",
    kycSubmittedAt: admin.firestore.Timestamp.fromDate(registerDate),
    kycReviewedAt: admin.firestore.Timestamp.fromDate(registerDate),
    onboardingComplete: true,
    accountStatus: "active",
    totals: {
      lockedPrincipal: 100,
      todayProfit,
      totalEarned: totalProfit,
      withdrawableProfit,
    },
    createdAt: admin.firestore.Timestamp.fromDate(registerDate),
    updatedAt: admin.firestore.Timestamp.fromDate(todayDate),
  });
  console.log("Created user profile document.");

  // 5. Create Deposit record ($100)
  const depositId = "GXDEP" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const txHash = "0x" + Math.random().toString(16).substring(2, 66).padEnd(64, "0");

  await adminDb.collection("users").doc(uid).collection("deposits").doc(depositId).set({
    amount: 100,
    method: "usdt_bep20",
    depositAddress: "0x7219a2034591274a82eea0ae24f7b472ea5842c9",
    investmentId,
    txHash,
    status: "verified",
    createdAt: admin.firestore.Timestamp.fromDate(depositDate),
    updatedAt: admin.firestore.Timestamp.fromDate(depositDate),
  });
  console.log("Created deposit record.");

  // 6. Create active Investment record
  await adminDb.collection("users").doc(uid).collection("investments").doc(investmentId).set({
    amount: 100,
    method: "usdt_bep20",
    status: "active",
    dailyRateMin: 0.005,
    dailyRateMax: 0.01,
    profitAvailable: withdrawableProfit,
    profitTotal: totalProfit,
    depositAddress: "0x7219a2034591274a82eea0ae24f7b472ea5842c9",
    txHash,
    activatedAt: admin.firestore.Timestamp.fromDate(depositDate),
    createdAt: admin.firestore.Timestamp.fromDate(depositDate),
    updatedAt: admin.firestore.Timestamp.fromDate(todayDate),
  });
  console.log("Created active investment record.");

  // 7. Store depositTxHashes
  await adminDb.collection("depositTxHashes").doc(txHash).set({
    uid,
    txHash,
    amount: 100,
    status: "verified",
    refPath: `users/${uid}/deposits/${depositId}`,
    createdAt: admin.firestore.Timestamp.fromDate(depositDate),
    updatedAt: admin.firestore.Timestamp.fromDate(depositDate),
  });

  // 8. Create approved Wallet payout record
  const walletId = "GXWAL" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const payoutWalletAddress = "0x1111111111111111111111111111111111111111";
  await adminDb.collection("users").doc(uid).collection("wallets").doc(walletId).set({
    address: payoutWalletAddress,
    label: "My BEP20 Wallet",
    status: "approved",
    reviewedBy: "codex-admin",
    reviewedAt: admin.firestore.Timestamp.fromDate(depositDate),
    createdAt: admin.firestore.Timestamp.fromDate(depositDate),
    updatedAt: admin.firestore.Timestamp.fromDate(depositDate),
  });
  console.log("Created wallet payout record.");

  // 9. Create Paid Withdrawal record ($40)
  const withdrawalId = "GXWTH" + Math.random().toString(36).substring(2, 10).toUpperCase();
  const payoutTxHash = "0x" + Math.random().toString(16).substring(2, 66).padEnd(64, "0");

  await adminDb.collection("users").doc(uid).collection("withdrawals").doc(withdrawalId).set({
    amount: withdrawAmount,
    walletAddress: payoutWalletAddress,
    investmentId,
    method: "usdt_bep20",
    type: "standard",
    speed: "standard",
    fee: 0,
    status: "paid",
    payoutTxHash,
    createdAt: admin.firestore.Timestamp.fromDate(withdrawalDate),
    updatedAt: admin.firestore.Timestamp.fromDate(withdrawalDate),
    paidAt: admin.firestore.Timestamp.fromDate(withdrawalDate),
  });
  console.log("Created paid withdrawal record.");

  // 10. Write ledger entries
  console.log("Writing ledger entries to Firestore...");

  // Write base transactions
  await adminDb.collection("ledgerEntries").add({
    uid,
    type: "deposit_created",
    amount: 100,
    status: "pending",
    refId: depositId,
    refPath: `users/${uid}/deposits/${depositId}`,
    txHash,
    createdAt: admin.firestore.Timestamp.fromDate(depositDate),
  });

  await adminDb.collection("ledgerEntries").add({
    uid,
    type: "deposit_approved",
    amount: 100,
    status: "verified",
    refId: depositId,
    refPath: `users/${uid}/deposits/${depositId}`,
    createdAt: admin.firestore.Timestamp.fromDate(depositDate),
  });

  await adminDb.collection("ledgerEntries").add({
    uid,
    type: "wallet_submitted",
    status: "pending",
    refId: walletId,
    refPath: `users/${uid}/wallets/${walletId}`,
    metadata: { address: payoutWalletAddress, label: "My BEP20 Wallet" },
    createdAt: admin.firestore.Timestamp.fromDate(depositDate),
  });

  await adminDb.collection("ledgerEntries").add({
    uid,
    type: "withdrawal_requested",
    amount: withdrawAmount,
    status: "pending",
    refId: withdrawalId,
    refPath: `users/${uid}/withdrawals/${withdrawalId}`,
    metadata: { walletAddress: payoutWalletAddress, investmentId, speed: "standard", fee: 0 },
    createdAt: admin.firestore.Timestamp.fromDate(withdrawalDate),
  });

  await adminDb.collection("ledgerEntries").add({
    uid,
    type: "withdrawal_paid",
    amount: withdrawAmount,
    status: "paid",
    refId: withdrawalId,
    refPath: `users/${uid}/withdrawals/${withdrawalId}`,
    txHash: payoutTxHash,
    createdAt: admin.firestore.Timestamp.fromDate(withdrawalDate),
  });

  // Batch insert daily profits (limit: 500 writes per batch in Firestore)
  const chunkSize = 250;
  for (let i = 0; i < profitLedgerWrites.length; i += chunkSize) {
    const chunk = profitLedgerWrites.slice(i, i + chunkSize);
    const batch = adminDb.batch();
    chunk.forEach((item) => {
      const docRef = adminDb.collection("ledgerEntries").doc();
      batch.set(docRef, item);
    });
    await batch.commit();
  }

  console.log(`Successfully batch inserted ${profitLedgerWrites.length} daily profit ledger entries.`);
  console.log(`User ${email} created successfully with password "${password}"!`);
}

seedUser()
  .then(() => {
    console.log("Seeding script finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error seeding user:", err);
    process.exit(1);
  });
