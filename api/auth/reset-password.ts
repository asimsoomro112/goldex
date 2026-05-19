import "dotenv/config";
import { adminAuth, adminDb } from "../_services/firebaseAdmin.js";

export default async function handler(req: any, res: any) {
  setApiHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: "Email, OTP and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const docRef = adminDb.collection("password_resets").doc(email.toLowerCase());
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(400).json({ error: "No reset code requested for this email." });
    }

    const data = docSnap.data();
    if (!data) {
      return res.status(400).json({ error: "Invalid request details." });
    }

    if (data.expiresAt < Date.now()) {
      await docRef.delete();
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    if (data.otp !== String(otp).trim()) {
      return res.status(400).json({ error: "Invalid verification code. Please try again." });
    }

    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      await adminAuth.updateUser(userRecord.uid, { password: newPassword });
      await docRef.delete();
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error("Firebase Admin password update failed:", err);
      return res.status(500).json({ error: "Firebase Admin configuration is not active. Please check server credentials." });
    }
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: error.message || "Failed to reset password." });
  }
}

function setApiHeaders(res: any) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
}
