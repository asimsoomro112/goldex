import { generateGoldExAiResponse } from "./_services/aiService.js";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: any, res: any) {
  setApiHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip, 30, 60_000)) {
    return res.status(429).json({ error: "Too many AI requests. Try again later." });
  }

  try {
    const text = await generateGoldExAiResponse(req.body);
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error("AI handler error:", error);
    return res.status(500).json({ 
      error: error.message || "AI request failed.",
      stack: error.stack,
      details: String(error)
    });
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
