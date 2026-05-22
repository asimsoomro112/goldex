# GoldEx

GoldEx is a React, Vite, Express, Firebase, and Vercel-ready gold-linked investment dashboard with Auth, Firestore records, admin review flows, USDT BEP20 deposits, withdrawals, support tickets, email notifications, live market pricing, and Gemini-powered assistant/KYC helpers.

## Local Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm start
```

The production server serves `dist/` and exposes the same `/api/*` routes used by Vercel.

## Required Launch Environment

Copy `.env.example` to `.env` for local development and configure the same keys in Vercel:

```bash
GEMINI_API_KEY="..."
METALPRICE_API_KEY="..."
SMTP_USER="your-gmail@gmail.com"
GMAIL_APP_PASSWORD="your-google-app-password"
MAIL_FROM="GoldEx <your-gmail@gmail.com>"

VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
VITE_FIREBASE_MEASUREMENT_ID="..."

FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", "...":"..."}'
VITE_USDT_BEP20_ADDRESS="0xYOUR_REAL_BEP20_USDT_WALLET"

VITE_CLOUDINARY_CLOUD_NAME="..."
VITE_CLOUDINARY_UPLOAD_PRESET="..."
APP_URL="https://your-production-domain.com"
```

`VITE_USDT_BEP20_ADDRESS` must be a real `0x...` BEP20 address before deposits are accepted. If it is missing, the app safely disables deposit actions instead of showing a fake wallet.

## Deploy

1. Push the repo to GitHub.
2. Create/import the project in Vercel.
3. Add the environment variables above in Vercel Project Settings.
4. Deploy with the default `npm run build` command.
5. Deploy `firestore.rules` to Firebase.

## Launch Checks

```bash
npm run build
```

Then confirm:

- `/api/health` returns `{ "status": "ok" }`.
- `/api/gold-price` returns a live price or configured fallback.
- Firebase Auth domains include your production domain.
- Firestore rules are deployed.
- Gmail App Password and Firebase Admin credentials are active.
- The real BEP20 deposit wallet is set in both local and production environments.
