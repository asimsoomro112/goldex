type GoldPriceSnapshot = {
  symbol: string;
  price: number | null;
  currency: string;
  updatedAt: string;
  source: string;
  configured: boolean;
};

export async function getGoldPriceSnapshot(): Promise<GoldPriceSnapshot> {
  // 1. Try Binance PAXG/USDT (Real-time, free, no key, updates every second)
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT", {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      const price = Number(data?.price);
      if (Number.isFinite(price) && price > 0) {
        return {
          symbol: "XAU/USD",
          price,
          currency: "USD",
          updatedAt: new Date().toISOString(),
          source: "Binance (PAXG/USDT)",
          configured: true,
        };
      }
    }
  } catch (err) {
    console.warn("Binance gold price fetch failed, trying Bybit...", err);
  }

  // 2. Try Bybit PAXG/USDT (Real-time, free, no key)
  try {
    const response = await fetch("https://api.bybit.com/v5/market/tickers?category=spot&symbol=PAXGUSDT", {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      const price = Number(data?.result?.list?.[0]?.lastPrice);
      if (Number.isFinite(price) && price > 0) {
        return {
          symbol: "XAU/USD",
          price,
          currency: "USD",
          updatedAt: new Date().toISOString(),
          source: "Bybit (PAXG/USDT)",
          configured: true,
        };
      }
    }
  } catch (err) {
    console.warn("Bybit gold price fetch failed, trying Metalprice...", err);
  }

  // 3. Fallback to Metalprice API (using configured env key or user key)
  const apiKey = process.env.METALPRICE_API_KEY || "50daaf9ca411c00d37dc1d36f851e76e";
  try {
    const response = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=EUR,XAU,XAG`, {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      const rawXau = data?.rates?.XAU;
      const rawUsdxau = data?.rates?.USDXAU;

      let price: number | null = null;
      if (rawUsdxau && Number.isFinite(Number(rawUsdxau))) {
        price = Number(rawUsdxau);
      } else if (rawXau && Number.isFinite(Number(rawXau)) && Number(rawXau) > 0) {
        price = 1 / Number(rawXau);
      }

      if (price) {
        const timestamp = data?.timestamp;
        const refreshed = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
        return {
          symbol: "XAU/USD",
          price,
          currency: "USD",
          updatedAt: refreshed,
          source: "Metalprice API",
          configured: true,
        };
      }
    }
  } catch (err) {
    console.error("Metalprice API fallback failed:", err);
  }

  return fallbackSnapshot();
}

function fallbackSnapshot(): GoldPriceSnapshot {
  return {
    symbol: "XAU/USD",
    price: null,
    currency: "USD",
    updatedAt: new Date().toISOString(),
    source: "All sources unavailable",
    configured: false,
  };
}
