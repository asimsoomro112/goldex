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
