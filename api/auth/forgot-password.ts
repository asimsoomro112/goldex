import { adminAuth, adminDb } from "../_services/firebaseAdmin.js";
import { createOtp, sendGoldExEmail } from "../_services/emailService.js";

export default async function handler(req: any, res: any) {
  setApiHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

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

function setApiHeaders(res: any) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
}
