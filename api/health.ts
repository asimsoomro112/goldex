import { getGoldPriceSnapshot } from "./_services/marketService.js";

export default async function handler(_req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const data = await getGoldPriceSnapshot();
    res.status(200).json({ 
      status: "ok",
      nodeVersion: process.version,
      goldPrice: data
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      error: error.message,
      stack: error.stack
    });
  }
}
