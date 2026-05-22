import fs from "node:fs/promises";
import { GoogleAuth } from "google-auth-library";

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "firebase-service-account.json";
const rulesPath = process.env.FIRESTORE_RULES_PATH || "firestore.rules";
const serviceAccount = JSON.parse(await fs.readFile(serviceAccountPath, "utf8"));
const projectId = process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id;

if (!projectId) {
  throw new Error("Firebase project id is missing.");
}

const auth = new GoogleAuth({
  keyFile: serviceAccountPath,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

const client = await auth.getClient();
const tokenResponse = await client.getAccessToken();
const token = typeof tokenResponse === "string" ? tokenResponse : tokenResponse?.token;

if (!token) {
  throw new Error("Could not obtain Google access token.");
}

const rulesContent = await fs.readFile(rulesPath, "utf8");

async function api(path, options = {}) {
  const response = await fetch(`https://firebaserules.googleapis.com/v1/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${body?.error?.message || JSON.stringify(body)}`);
  }
  return body;
}

const ruleset = await api(`projects/${projectId}/rulesets`, {
  method: "POST",
  body: JSON.stringify({
    source: {
      files: [
        {
          name: rulesPath,
          content: rulesContent,
        },
      ],
    },
  }),
});

const release = await api(`projects/${projectId}/releases/cloud.firestore`, {
  method: "PATCH",
  body: JSON.stringify({
    release: {
      name: `projects/${projectId}/releases/cloud.firestore`,
      rulesetName: ruleset.name,
    },
    updateMask: "rulesetName",
  }),
});

console.log(JSON.stringify({
  projectId,
  rulesetName: ruleset.name,
  releaseName: release.name,
  releaseRulesetName: release.rulesetName,
}, null, 2));
