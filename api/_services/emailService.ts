import nodemailer from "nodemailer";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export const EMAIL_TYPES = new Set([
  "registration",
  "otp",
  "password_reset",
  "deposit_request",
  "deposit_verified",
  "deposit_rejected",
  "investment_selected",
  "withdrawal_request",
  "withdrawal_paid",
  "withdrawal_rejected",
  "support_reply",
]);

export type EmailPayload = {
  type: string;
  to: string;
  name?: string;
  data?: Record<string, any>;
};

// ─── Badge & accent config per email type ─────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  registration: { label: "Account Created", color: "#4F8EF7", icon: "✦" },
  otp: { label: "Verification Code", color: "#A78BFA", icon: "⬡" },
  password_reset: { label: "Security Alert", color: "#F97316", icon: "⚠" },
  deposit_request: { label: "Pending Review", color: "#EAB308", icon: "◎" },
  deposit_verified: { label: "Verified", color: "#22C55E", icon: "✔" },
  deposit_rejected: { label: "Rejected", color: "#EF4444", icon: "✕" },
  investment_selected: { label: "Plan Activated", color: "#FFD700", icon: "◈" },
  withdrawal_request: { label: "Under Processing", color: "#EAB308", icon: "◎" },
  withdrawal_paid: { label: "Payment Sent", color: "#22C55E", icon: "✔" },
  withdrawal_rejected: { label: "Rejected", color: "#EF4444", icon: "✕" },
  support_reply: { label: "Support Response", color: "#4F8EF7", icon: "✉" },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendGoldExEmail(payload: EmailPayload) {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const from = process.env.MAIL_FROM || `GoldEx <${user}>`;

  if (!EMAIL_TYPES.has(payload.type)) throw new Error("Unsupported email type.");
  if (!isEmail(payload.to)) throw new Error("Invalid recipient email.");
  if (!user || !pass) throw new Error("SMTP is not configured.");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  const template = buildEmailTemplate(payload.type, payload.name, payload.data ?? {});

  const envLogoUrl = process.env.EMAIL_LOGO_URL;
  const envBannerUrl = process.env.EMAIL_BANNER_URL;
  const appUrl = (process.env.VITE_APP_URL || process.env.APP_URL || "").replace(/\/$/, "");

  const useHosted = !!(envLogoUrl || envBannerUrl || appUrl);

  const logoUrl = envLogoUrl || (appUrl ? `${appUrl}/images/Navbar.png` : "cid:navbar_logo");
  const bannerUrl = envBannerUrl || (appUrl ? `${appUrl}/images/Email%20Header%20Banner.png` : "cid:email_banner");

  const customHtml = template.html
    .replace(/cid:navbar_logo/g, logoUrl)
    .replace(/cid:email_banner/g, bannerUrl);

  const mailOptions: any = {
    from,
    to: payload.to,
    subject: template.subject,
    html: customHtml,
    text: template.text,
  };

  if (!useHosted) {
    mailOptions.attachments = [
      {
        filename: "Navbar.png",
        path: path.join(process.cwd(), "public", "images", "Navbar.png"),
        cid: "navbar_logo",
        disposition: "inline",
      } as any,
      {
        filename: "Email_Header_Banner.png",
        path: path.join(process.cwd(), "public", "images", "Email Header Banner.png"),
        cid: "email_banner",
        disposition: "inline",
      } as any,
    ];
  }

  await transporter.sendMail(mailOptions);
}

export function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function sanitizeEmailPayload(body: any): EmailPayload {
  const { type, to, name, data } = body ?? {};
  if (!type || !to) throw new Error("Email type and recipient are required.");
  return {
    type: String(type),
    to: String(to).trim(),
    name: name ? String(name).slice(0, 120) : undefined,
    data: typeof data === "object" && data !== null ? data : {},
  };
}

// ─── Template Builder ─────────────────────────────────────────────────────────

function buildEmailTemplate(type: string, name = "Valued Member", data: Record<string, any>) {
  const amount = formatMoney(data.amount);
  const plan = data.plan ?? "Selected Plan";
  const txHash = data.txHash ?? "Not provided";
  const walletAddress = data.walletAddress ?? "Not provided";
  const otp = data.otp ?? "";
  const meta = TYPE_META[type] ?? { label: type, color: "#FFD700", icon: "•" };

  type TemplateConfig = {
    subject: string;
    headline: string;
    body: string;
    details?: Array<{ label: string; value: string }>;
    cta?: string;
    ctaNote?: string;
  };

  const templates: Record<string, TemplateConfig> = {
    registration: {
      subject: "Welcome to GoldEx — Your Account Is Ready",
      headline: `Welcome aboard, ${escHtml(name)}.`,
      body: "Your GoldEx account has been created successfully. You now have access to your personal investment dashboard where you can submit USDT BEP20 deposits and track live profit records in real time.",
      cta: "Go to Dashboard",
      ctaNote: "Complete your first deposit to activate your investment.",
    },

    otp: {
      subject: "Your GoldEx One-Time Verification Code",
      headline: "Verify your identity",
      body: "Use the code below to complete your action. For security, this code is valid for a limited time and must not be shared with anyone — GoldEx will never ask for it.",
      details: [{ label: "Verification Code", value: otp }],
      ctaNote: "If you did not request this, please secure your account immediately.",
    },

    password_reset: {
      subject: "GoldEx — Password Reset Code",
      headline: "Reset your password",
      body: `Hi ${escHtml(name)}, we received a request to reset your GoldEx password. Use the verification code below to set a new password.`,
      details: [{ label: "Verification Code", value: otp }],
      ctaNote: "If you did not request this, please secure your account immediately.",
    },

    deposit_request: {
      subject: "Deposit Request Received — Under Review",
      headline: "Your deposit is under manual review.",
      body: `We have received your USDT BEP20 deposit request. Our admin team will manually verify the transaction on-chain and update your status within 24 hours.`,
      details: [
        { label: "Requested Amount", value: amount },
        { label: "TX Hash", value: txHash },
        { label: "Network", value: "BEP20 (BSC)" },
        { label: "Status", value: "Pending Verification" },
      ],
      ctaNote: "You will receive an email once your deposit has been verified or if action is required.",
    },

    deposit_verified: {
      subject: "Deposit Verified — Investment Is Now Active",
      headline: "Your deposit has been verified.",
      body: `Great news, ${escHtml(name)}. Your USDT BEP20 deposit has been confirmed and your investment is now live. Daily profit accrual begins immediately.`,
      details: [
        { label: "Verified Amount", value: amount },
        { label: "Network", value: "BEP20 (BSC)" },
        { label: "Daily Profit Range", value: "0.5% – 1.0%" },
        { label: "Status", value: "Active" },
      ],
      ctaNote: "Profit withdrawal unlocks once your accumulated profit reaches $50.",
    },

    deposit_rejected: {
      subject: "Deposit Request Rejected — Action Required",
      headline: "Your deposit request was rejected.",
      body: `Hi ${escHtml(name)}, after manual review, your deposit request for ${amount} could not be verified.`,
      details: [
        { label: "Requested Amount", value: amount },
        { label: "Status", value: "Rejected" },
        { label: "Reason for Rejection", value: data.rejectionReason || "Transaction hash could not be verified on-chain." },
      ],
      ctaNote: "You can re-submit your deposit request with the correct transaction details, or contact our support team for assistance.",
    },

    investment_selected: {
      subject: "Investment Plan Activated — GoldEx",
      headline: "Your investment plan is active.",
      body: `Hi ${escHtml(name)}, you have successfully selected an investment plan on GoldEx. Your principal remains securely locked for the plan duration. Profit accrues daily at a rate between 0.5% and 1.0%.`,
      details: [
        { label: "Plan", value: plan },
        { label: "Invested Amount", value: amount },
        { label: "Daily Profit Range", value: "0.5% – 1.0%" },
        { label: "Withdrawal Unlocks", value: "After $50 accumulated profit" },
      ],
      ctaNote: "Track your live profit balance anytime from your GoldEx dashboard.",
    },

    withdrawal_request: {
      subject: "Withdrawal Request Submitted — Processing",
      headline: "Withdrawal request received.",
      body: `Hi ${escHtml(name)}, your profit withdrawal request has been submitted and is now queued for manual processing. Expected payout will be sent to your registered BEP20 wallet address.`,
      details: [
        { label: "Withdrawal Amount", value: amount },
        { label: "Network", value: "BEP20 (BSC)" },
        { label: "Wallet Address", value: walletAddress },
        { label: "Status", value: "Queued for Processing" },
      ],
      ctaNote: "You will be notified once the payment has been dispatched.",
    },

    withdrawal_paid: {
      subject: "Withdrawal Processed — Payment Sent",
      headline: "Your withdrawal has been paid.",
      body: `Hi ${escHtml(name)}, your withdrawal has been processed and the USDT has been dispatched to your BEP20 wallet. Please allow a few minutes for the transaction to reflect on-chain.`,
      details: [
        { label: "Amount Sent", value: amount },
        { label: "Network", value: "BEP20 (BSC)" },
        { label: "Wallet Address", value: walletAddress },
        { label: "Status", value: "Paid" },
      ],
      ctaNote: "If the amount has not appeared within 30 minutes, contact our support team.",
    },

    withdrawal_rejected: {
      subject: "Withdrawal Rejected — GoldEx",
      headline: "Your withdrawal request was rejected.",
      body: `Hi ${escHtml(name)}, unfortunately your withdrawal request for ${amount} was rejected during manual review.`,
      details: [
        { label: "Requested Amount", value: amount },
        { label: "Status", value: "Rejected" },
        { label: "Reason for Rejection", value: data.rejectionReason || "Incorrect wallet address or account audit issue." },
      ],
      ctaNote: "Please check your registered details or contact our support team to resolve this.",
    },

    support_reply: {
      subject: "Response from GoldEx Support",
      headline: "Our team has responded.",
      body: `Hi ${escHtml(name)}, the GoldEx support team has reviewed your inquiry and responded below. Please read carefully and follow up through your dashboard if you need further assistance.`,
      details: [{ label: "Support Message", value: data.message ?? "" }],
      ctaNote: "For urgent matters, you may reply directly to this email.",
    },
  };

  const cfg = templates[type];
  const text = `${cfg.headline}\n\n${stripTags(cfg.body)}\n\n${(cfg.details ?? []).map(d => `${d.label}: ${d.value}`).join("\n")}\n\n${cfg.ctaNote ?? ""}`;

  return {
    subject: cfg.subject,
    text,
    html: renderLayout({ type, meta, config: cfg }),
  };
}

// ─── HTML Renderer ────────────────────────────────────────────────────────────

type RenderArgs = {
  type: string;
  meta: { label: string; color: string; icon: string };
  config: {
    headline: string;
    body: string;
    details?: Array<{ label: string; value: string }>;
    cta?: string;
    ctaNote?: string;
  };
};

function renderLayout({ type, meta, config }: RenderArgs) {
  const isOtp = type === "otp";
  const detailRows = (config.details ?? [])
    .map(({ label, value }, i) => renderDetailRow(label, value, i, isOtp))
    .join("");

  const ctaButton = config.cta
    ? `
      <div style="text-align:center;margin:28px 0 0">
        <a href="#" style="
          display:inline-block;
          padding:14px 38px;
          background:linear-gradient(135deg,#C9A83C 0%,#FFD700 50%,#C9A83C 100%);
          color:#07070D;
          font-weight:700;
          font-size:14px;
          letter-spacing:.6px;
          text-decoration:none;
          border-radius:50px;
          border:none;
          box-shadow:0 4px 20px rgba(212,175,55,.35);
        ">${escHtml(config.cta)}</a>
      </div>`
    : "";

  const ctaNote = config.ctaNote
    ? `<p style="font-size:12.5px;line-height:1.7;color:rgba(232,228,212,.45);margin:18px 0 0;text-align:center;">${escHtml(config.ctaNote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="dark"/>
<meta name="supported-color-schemes" content="dark"/>
<title>GoldEx</title>
<style>
  @media only screen and (max-width:600px){
    .email-wrapper  { padding:16px 8px !important; }
    .email-card     { border-radius:12px !important; }
    .email-body     { padding:24px 18px !important; }
    .email-header   { padding:18px !important; }
    .email-footer   { padding:14px 18px !important; }
    .detail-row     { display:block !important; }
    .detail-label   { display:block !important; margin-bottom:3px !important; }
    .detail-value   { display:block !important; text-align:left !important; }
    .otp-code       { font-size:36px !important; letter-spacing:10px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#06060F;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;">

<!-- Outer wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#06060F;">
  <tr>
    <td align="center" class="email-wrapper" style="padding:36px 16px;">

      <!-- Main card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-card"
        style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid rgba(212,175,55,.18);background:#0A0A15;">

        <!-- Hero banner -->
        <tr>
          <td>
            <img src="cid:email_banner" alt="GoldEx" width="600"
              style="width:100%;max-width:600px;height:auto;display:block;border-bottom:1px solid rgba(212,175,55,.12);" />
          </td>
        </tr>

        <!-- Brand header -->
        <tr>
          <td class="email-header" style="padding:20px 32px;background:#07070E;border-bottom:1px solid rgba(212,175,55,.1);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="cid:navbar_logo" alt="GoldEx" height="48"
                    style="height:48px;width:auto;display:block;border:0;outline:none;" />
                  <div style="font-size:11px;color:rgba(212,175,55,.5);margin-top:5px;letter-spacing:.8px;text-transform:uppercase;">
                    USDT BEP20 Investment Platform
                  </div>
                </td>
                <td align="right" style="vertical-align:middle;">
                  <!-- Status badge -->
                  <span style="
                    display:inline-block;
                    padding:5px 13px;
                    border-radius:50px;
                    background:${meta.color}18;
                    border:1px solid ${meta.color}55;
                    color:${meta.color};
                    font-size:11.5px;
                    font-weight:600;
                    letter-spacing:.4px;
                  ">${escHtml(meta.icon)}&nbsp;&nbsp;${escHtml(meta.label)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Accent line -->
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,transparent,${meta.color}88,transparent);"></td>
        </tr>

        <!-- Body -->
        <tr>
          <td class="email-body" style="padding:32px 32px 28px;">

            <!-- Headline -->
            <h1 style="
              margin:0 0 16px;
              font-size:22px;
              font-weight:700;
              color:#FFFFFF;
              line-height:1.3;
              letter-spacing:-.2px;
            ">${config.headline}</h1>

            <!-- Body text -->
            <p style="
              margin:0 0 24px;
              font-size:15px;
              line-height:1.75;
              color:rgba(232,228,212,.72);
            ">${config.body}</p>

            ${detailRows ? `
            <!-- Detail card -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="
              background:rgba(255,255,255,.032);
              border:1px solid rgba(212,175,55,.14);
              border-radius:12px;
              overflow:hidden;
              margin-bottom:4px;
            ">
              ${detailRows}
            </table>` : ""}

            ${ctaButton}
            ${ctaNote}

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="height:1px;background:rgba(212,175,55,.1);"></td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="email-footer" style="padding:20px 32px;background:#07070E;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-size:11.5px;color:rgba(232,228,212,.3);line-height:1.6;">
                    🔒&nbsp; This is a system-generated email from GoldEx. Do not share OTPs, private keys, or wallet credentials with anyone — including GoldEx staff.
                  </p>
                  <p style="margin:0;font-size:11px;color:rgba(232,228,212,.2);">
                    © ${new Date().getFullYear()} GoldEx &nbsp;·&nbsp; USDT BEP20 Investment Platform &nbsp;·&nbsp; All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- /Main card -->

    </td>
  </tr>
</table>

</body>
</html>`;
}

// ─── Detail Row Builder ───────────────────────────────────────────────────────

function renderDetailRow(label: string, value: string, index: number, isOtp: boolean) {
  const isLast = false; // border handled by container
  const bg = index % 2 === 0 ? "rgba(255,255,255,0)" : "rgba(212,175,55,.025)";

  if (isOtp && label === "Verification Code") {
    return `
    <tr>
      <td style="padding:28px 24px;text-align:center;background:rgba(167,139,250,.04);">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(167,139,250,.6);margin-bottom:12px;">
          One-Time Code
        </div>
        <div class="otp-code" style="
          font-size:42px;
          font-weight:800;
          letter-spacing:14px;
          color:#A78BFA;
          font-variant-numeric:tabular-nums;
          text-shadow:0 0 40px rgba(167,139,250,.4);
          line-height:1;
        ">${escHtml(value)}</div>
        <div style="font-size:11.5px;color:rgba(232,228,212,.3);margin-top:12px;">
          Do not share this code with anyone
        </div>
      </td>
    </tr>`;
  }

  const isSupportMessage = label === "Support Message";

  return `
  <tr style="background:${bg};">
    <td class="detail-row" style="padding:12px 20px;border-bottom:1px solid rgba(212,175,55,.08);">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="detail-label" style="
            font-size:11.5px;
            font-weight:600;
            letter-spacing:.5px;
            text-transform:uppercase;
            color:rgba(212,175,55,.55);
            white-space:nowrap;
            padding-right:16px;
            vertical-align:top;
            width:38%;
          ">${escHtml(label)}</td>
          <td class="detail-value" style="
            font-size:13.5px;
            color:rgba(232,228,212,.85);
            font-family:${isSupportMessage ? "inherit" : "'Courier New',monospace"};
            word-break:break-all;
            text-align:right;
            vertical-align:top;
          ">${isSupportMessage ? `<div style="font-family:inherit;font-size:14px;line-height:1.7;color:rgba(232,228,212,.8);text-align:left;">${escHtml(value)}</div>` : escHtml(value)}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatMoney(value: any) {
  const n = Number(value || 0);
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escHtml(value: any): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}