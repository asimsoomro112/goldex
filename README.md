# ⚜️ GoldEx — Premium Gold Investment & Trading Platform

GoldEx is a high-performance digital gold investment platform combining physical-backed asset tracking, live gold market indicators, custom KYC/AML desks, and an interactive Gemini AI financial helper. Built on a premium glassmorphic Noir theme, it provides a seamless and secure gold trading simulation.

---

## ✨ Features

- **📊 Live XAU spot pricing:** Integrated with Metalprice API for precise real-time spot updates.
- **🛡️ Secure KYC & Transactions:** Dynamic document uploads, Binance Smart Chain (USDT BEP20) manual deposit desks, and automated security rule configurations.
- **🤖 Gemini AI Advisor:** On-platform AI assistant that helps users understand gold asset trends and management.
- **📧 Zero-Attachment Email System:** Automatic hosted asset detection that ensures emails land in Gmail with premium layouts and zero clip tags.
- **⚡ Vercel Serverless Ready:** Pre-configured paths mapping to stateless endpoints backed by Firestore.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Framer Motion, Recharts, TailwindCSS
- **Backend:** Node.js, Express, tsx, esbuild
- **Serverless Functions:** Vercel Lambdas
- **Database & Auth:** Firebase Authentication & Cloud Firestore
- **Integrations:** Nodemailer (Gmail SMTP), Cloudinary (Avatar Uploads), Gemini AI Studio SDK

---

## 🚀 Setup & Local Execution

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory. Use `.env.example` as a template:

```bash
# SMTP Credentials
SMTP_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-google-app-password"
MAIL_FROM="GoldEx <your-email@gmail.com>"

# API Keys
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
METALPRICE_API_KEY="YOUR_METALPRICE_API_KEY"

# Deposit Address
VITE_USDT_BEP20_ADDRESS="your-usdt-bep20-wallet-address"

# Media Uploads (Cloudinary)
VITE_CLOUDINARY_CLOUD_NAME="your-cloud-name"
VITE_CLOUDINARY_UPLOAD_PRESET="your-upload-preset"
```

### 3. Run Locally
Start the development Express server and Vite builder:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📦 Deployment on Vercel

The repository is pre-configured to run as a serverless application on Vercel. 

1. Push to your GitHub repository.
2. Link the repository to your Vercel Dashboard.
3. Configure the environment variables matching your `.env` file in **Vercel Settings > Environment Variables**.
4. Deploy!
