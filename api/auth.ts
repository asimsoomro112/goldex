import { adminAuth, adminDb } from "./_services/firebaseAdmin.js";
import { createOtp, sendGoldExEmail } from "./_services/emailService.js";

export default async function handler(req: any, res: any) {
  setApiHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const action = req.query.action || req.body.action;

  if (action === "forgot-password") {
    return handleForgotPassword(req, res);
  } else if (action === "verify-reset-otp") {
    return handleVerifyResetOtp(req, res);
  } else if (action === "reset-password") {
    return handleResetPassword(req, res);
  } else {
    return res.status(400).json({ error: "Invalid or missing action parameter." });
  }
}

async function handleForgotPassword(req: any, res: any) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "Email is required." });

    let name = "GoldEx User";
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      name = userRecord.displayName || "GoldEx User";
    } catch (err: any) {
      console.warn("User lookup failed for reset:", err.message);
      if (err.code === "auth/user-not-found") {
        return res.status(404).json({ error: "No account found with this email address." });
      }
    }

    const otp = createOtp();
    const expiresAt = Date.now() + 15 * 60_000;

    // Store in Firestore for serverless state sharing
    await adminDb.collection("password_resets").doc(email.toLowerCase()).set({
      otp,
      expiresAt,
    });

    await sendGoldExEmail({
      type: "password_reset",
      to: email,
      name,
      data: { otp }
    });

    return res.status(200).json({ ok: true, devOtp: process.env.NODE_ENV === "production" ? undefined : otp });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: error.message || "Failed to send reset code." });
  }
}

async function handleVerifyResetOtp(req: any, res: any) {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
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

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ error: error.message || "Failed to verify code." });
  }
}

async function handleResetPassword(req: any, res: any) {
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
