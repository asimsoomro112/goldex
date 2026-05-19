import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const isInitialized = admin.apps.length > 0;

if (!isInitialized) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(process.cwd(), "firebase-service-account.json");

  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(parsed)
      });
      console.log("Firebase Admin initialized via service account env variable.");
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e);
      admin.initializeApp();
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });
      console.log(`Firebase Admin initialized via service account file: ${serviceAccountPath}`);
    } catch (e) {
      console.error("Failed to initialize Firebase Admin via service account file:", e);
      admin.initializeApp();
    }
  } else {
    try {
      // If deployed on Google Cloud Platform, this will auto-detect credentials
      admin.initializeApp();
      console.log("Firebase Admin initialized via Application Default Credentials.");
    } catch (e) {
      console.warn("Firebase Admin default init failed. Initializing with Project ID fallback.", e);
      admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || "goldex-c4347"
      });
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
