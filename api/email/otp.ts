import "dotenv/config";
import { createOtp, sendGoldExEmail } from "../_services/emailService.js";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: any, res: any) {
  setApiHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip, 5, 60_000)) {
    return res.status(429).json({ error: "Too many OTP requests. Try again later." });
  }

  try {
    const { to, name } = req.body || {};
    if (!to) return res.status(400).json({ error: "Recipient email is required." });

    const otp = createOtp();
    await sendGoldExEmail({ type: "otp", to: String(to).trim(), name, data: { otp } });
    return res.status(200).json({ ok: true, devOtp: process.env.NODE_ENV === "production" ? undefined : otp });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "OTP email failed." });
  }
}

function setApiHeaders(res: any) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cache-Control", "no-store");
}

function getClientIp(req: any) {
  const forwardedFor = String(req.headers?.["x-forwarded-for"] || "");
  return forwardedFor.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

function isRateLimited(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimit.get(key);
  if (!current || current.resetAt < now) {
    rateLimit.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > maxRequests;
}
