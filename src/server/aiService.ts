import { GoogleGenAI } from "@google/genai";
import { getGoldPriceSnapshot } from "./marketService";

type ChatMessage = {
  role: string;
  content: string;
};

type UserContext = {
  uid?: string | null;
  displayName?: string | null;
  totalInvested?: number;
  totalProfit?: number;
  withdrawableProfit?: number;
  activeInvestments?: number;
  dataSource?: string;
  hasLivePortfolioData?: boolean;
};

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4_000;

export async function generateGoldExAiResponse(body: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw statusError("AI API key is not configured.", 500);
  }

  const messages = sanitizeMessages(body?.messages);
  const userContext = sanitizeUserContext(body?.userContext);

  if (messages.length === 0) {
    throw statusError("At least one chat message is required.", 400);
  }

  let goldPriceContext = "";
  try {
    const goldPrice = await getGoldPriceSnapshot();
    if (goldPrice && goldPrice.price) {
      goldPriceContext = `Current Gold Spot Price (XAU/USD): $${goldPrice.price.toFixed(2)} (Source: ${goldPrice.source}, Updated at: ${goldPrice.updatedAt})`;
    }
  } catch (err) {
    console.warn("Failed to attach gold price to AI prompt:", err);
  }

  const systemPrompt = [
    "You are GoldEx AI Agent, a premium real-time gold market analyst and platform assistant.",
    "When asked about technical analysis, market structure, trend, or price direction, you MUST respond in a brief, highly concise, and scannable format.",
    "Do NOT write long paragraphs. Keep the analysis direct and strictly formatted as follows:",
    "",
    "### 📊 XAUUSD Technical Analysis",
    "* **Current Price:** $[Live Price]",
    "* **Trend Sentiment:** [BULLISH / BEARISH / NEUTRAL] (e.g. Strong Bullish, Weak Neutral, etc.)",
    "* **Market Structure:** [1 short sentence, e.g. Breakout above key resistance, Consolidating at range highs]",
    "* **Key Levels:**",
    "  * 🔴 **Resistance:** $[Level 1] | $[Level 2]",
    "  * 🟢 **Support:** $[Level 1] | $[Level 2]",
    "* **Technical Indicators:** RSI is [Overbought/Oversold/Neutral], price is [Above/Below] short-term Moving Averages.",
    "* **Outlook:** [1 concise sentence on next likely movement and what triggers it].",
    "* **Signal Sentiment:** [BUY / SELL / HOLD]",
    "",
    "Do not refuse to answer or say you cannot perform technical analysis. Calculate actual support/resistance values based on the current live price (e.g. key round numbers near the live price).",
    "At the very end of the message, add a single-line educational disclaimer.",
    "",
    goldPriceContext,
    "",
    `User Context:\n${JSON.stringify(userContext, null, 2)}`,
  ].join("\n");

  const ai = new GoogleGenAI({ apiKey });
  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map((message) => ({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.content }],
      })),
      config: {
        systemInstruction: systemPrompt,
      },
    });
  } catch (err) {
    console.warn("gemini-2.5-flash failed, trying fallback gemini-1.5-flash:", err);
    try {
      response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: messages.map((message) => ({
          role: message.role === "user" ? "user" : "model",
          parts: [{ text: message.content }],
        })),
        config: {
          systemInstruction: systemPrompt,
        },
      });
    } catch (fallbackErr: any) {
      console.error("All Gemini models failed:", fallbackErr);
      throw statusError(fallbackErr.message || "AI service is currently experiencing high demand. Please try again in a few seconds.", 503);
    }
  }

  return response.text || "I could not generate a response right now.";
}

function sanitizeMessages(value: any): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_MESSAGES)
    .map((item) => ({
      role: item?.role === "user" ? "user" : "assistant",
      content: String(item?.content || "").slice(0, MAX_MESSAGE_LENGTH).trim(),
    }))
    .filter((item) => item.content.length > 0);
}

function sanitizeUserContext(value: any): UserContext {
  const data = value && typeof value === "object" ? value : {};
  return {
    uid: typeof data.uid === "string" ? data.uid.slice(0, 128) : null,
    displayName: typeof data.displayName === "string" ? data.displayName.slice(0, 120) : null,
    totalInvested: safeNumber(data.totalInvested),
    totalProfit: safeNumber(data.totalProfit),
    withdrawableProfit: safeNumber(data.withdrawableProfit),
    activeInvestments: safeNumber(data.activeInvestments),
    dataSource: data.dataSource === "live" ? "live" : "unknown",
    hasLivePortfolioData: Boolean(data.hasLivePortfolioData),
  };
}

function safeNumber(value: any) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function statusError(message: string, statusCode: number) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
}

export async function analyzeKycDocument(body: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw statusError("AI API key is not configured.", 500);
  }

  const { documentUrl, documentType } = body || {};
  if (!documentUrl) {
    throw statusError("documentUrl is required.", 400);
  }

  try {
    const imgResponse = await fetch(documentUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch image from Cloudinary: ${imgResponse.statusText}`);
    }
    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";

    const systemPrompt = `You are a professional automated KYC identity verification agent for GoldEx. 
Your job is to examine the provided identity document (which is claimed to be a ${documentType || 'passport'}).
Perform the following checks:
1. Verify if the document looks authentic and is not fake or edited.
2. Read the legal full name, document number, country of issue, date of birth, and expiry date.
3. Determine if the document matches the requested type: ${documentType || 'passport'}.

Provide your final assessment as a raw JSON object. Your output must be strictly valid JSON and nothing else. No markdown formatting, no backticks, no comments.
JSON schema:
{
  "legalName": "string or empty",
  "documentNumber": "string or empty",
  "country": "string or empty",
  "dob": "string (YYYY-MM-DD) or empty",
  "expiryDate": "string (YYYY-MM-DD) or empty",
  "verified": true or false,
  "confidenceScore": number from 0 to 100 (rating document legibility and completeness),
  "notes": "Brief explanation of the decision or reasons for rejection (max 100 chars)"
}`;

    const ai = new GoogleGenAI({ apiKey });
    
    // Call Gemini 2.5 Flash
    let response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
            {
              text: "Analyze this document and return JSON matching the specified schema."
            }
          ]
        }
      ],
      config: {
        systemInstruction: systemPrompt,
      },
    });

    let text = response.text || "{}";
    // Clean markdown code blocks if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseErr) {
      console.error("Failed to parse Gemini response as JSON:", text, parseErr);
      throw new Error("Gemini did not return valid JSON output.");
    }
  } catch (err: any) {
    console.error("KYC analysis error:", err);
    throw statusError(err.message || "Failed to analyze KYC document.", 500);
  }
}
