import "dotenv/config";
import { adminDb } from "../../src/server/firebaseAdmin";

export default async function handler(req: any, res: any) {
  setApiHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

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

function setApiHeaders(res: any) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
}
