import express from "express";
import "dotenv/config";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createOtp, sanitizeEmailPayload, sendGoldExEmail } from "./src/server/emailService";
import { generateGoldExAiResponse, analyzeKycDocument } from "./src/server/aiService";
import { getGoldPriceSnapshot } from "./src/server/marketService";
import { adminAuth, adminDb } from "./src/server/firebaseAdmin";
import depositStatusHandler from "./api/deposit-status";
import reinvestHandler from "./api/reinvest";
import settleHandler from "./api/settle";
import withdrawHandler from "./api/withdraw";

const emailRateLimit = new Map<string, { count: number; resetAt: number }>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    next();
  });
  app.use(express.json({ limit: "64kb" }));

  // API constraints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/email", async (req, res) => {
    try {
      if (isRateLimited(req.ip || "unknown")) return res.status(429).json({ error: "Too many email requests. Try again later." });

      const payload = sanitizeEmailPayload(req.body);
      await sendGoldExEmail(payload);
      res.json({ ok: true });
    } catch (error: any) {
      console.error(error);
      res.status(error.message?.includes("Invalid") || error.message?.includes("required") ? 400 : 500).json({ error: error.message });
    }
  });

  app.post("/api/email/otp", async (req, res) => {
    try {
      if (isRateLimited(req.ip || "unknown")) return res.status(429).json({ error: "Too many OTP requests. Try again later." });
      const { to, name } = req.body || {};
      if (!to) return res.status(400).json({ error: "Recipient email is required." });

      const otp = createOtp();
      await sendGoldExEmail({ type: "otp", to, name, data: { otp } });
      res.json({ ok: true, devOtp: process.env.NODE_ENV === "production" ? undefined : otp });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
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

      res.json({ ok: true, devOtp: process.env.NODE_ENV === "production" ? undefined : otp });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: error.message || "Failed to send reset code." });
    }
  });

  app.post("/api/auth/verify-reset-otp", async (req, res) => {
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

      res.json({ ok: true });
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: error.message || "Failed to verify code." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
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
        res.json({ ok: true });
      } catch (err: any) {
        console.error("Firebase Admin password update failed:", err);
        return res.status(500).json({ error: "Firebase Admin configuration is not active. Please check server credentials." });
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: error.message || "Failed to reset password." });
    }
  });

  app.get("/api/gold-price", async (_req, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.json(await getGoldPriceSnapshot());
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/deposit-status", async (req, res) => {
    await depositStatusHandler(req, res);
  });

  app.post("/api/reinvest", async (req, res) => {
    await reinvestHandler(req, res);
  });

  app.post("/api/withdraw", async (req, res) => {
    await withdrawHandler(req, res);
  });

  app.post("/api/settle", async (req, res) => {
    await settleHandler(req, res);
  });

  // AI Chat endpoint
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const text = await generateGoldExAiResponse(req.body);
      res.json({ text });
    } catch (error: any) {
      console.error(error);
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  });

  // AI KYC Analyze endpoint
  app.post("/api/kyc/analyze", async (req, res) => {
    try {
      const result = await analyzeKycDocument(req.body);
      res.json(result);
    } catch (error: any) {
      console.error(error);
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  listen(app, PORT);
}

startServer();

function isRateLimited(key: string) {
  const now = Date.now();
  const current = emailRateLimit.get(key);
  if (!current || current.resetAt < now) {
    emailRateLimit.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  current.count += 1;
  return current.count > 20;
}

function listen(app: express.Express, port: number, attempts = 10) {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && attempts > 1) {
      console.warn(`Port ${port} is already in use. Trying ${port + 1}...`);
      listen(app, port + 1, attempts - 1);
      return;
    }

    throw error;
  });
}
