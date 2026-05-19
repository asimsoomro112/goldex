import "dotenv/config";
import { getGoldPriceSnapshot } from "./_services/marketService.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const data = await getGoldPriceSnapshot();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Gold price handler error:", error);
    return res.status(500).json({ 
      error: error.message || "Gold price lookup failed.", 
      stack: error.stack,
      details: String(error)
    });
  }
}
