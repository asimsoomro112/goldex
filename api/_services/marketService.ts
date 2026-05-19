type GoldPriceSnapshot = {
  symbol: string;
  price: number | null;
  currency: string;
  updatedAt: string;
  source: string;
  configured: boolean;
};

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function getGoldPriceSnapshot(): Promise<GoldPriceSnapshot> {
  // 1. Try Binance Futures XAU/USDT (Real-time Gold Perpetual Contract - highly permissive for cloud IPs)
  try {
    const response = await fetchWithTimeout("https://fapi.binance.com/fapi/v1/ticker/price?symbol=XAUUSDT", 5000);
    if (response.ok) {
      const data = await response.json();
      const price = Number(data?.price);
      if (Number.isFinite(price) && price > 0) {
        return {
          symbol: "XAU/USD",
          price,
          currency: "USD",
          updatedAt: new Date().toISOString(),
          source: "Binance Futures (XAU/USDT)",
          configured: true,
        };
      }
    }
  } catch (err) {
    console.warn("Binance Futures XAUUSDT fetch failed, trying Spot Binance PAXG...", err);
  }

  // 2. Try Binance Spot PAXG/USDT (Real-time, free, no key)
  try {
    const response = await fetchWithTimeout("https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT", 5000);
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
    console.warn("Binance Spot gold price fetch failed, trying Bybit...", err);
  }

  // 3. Try Bybit PAXG/USDT (Real-time, free, no key)
  try {
    const response = await fetchWithTimeout("https://api.bybit.com/v5/market/tickers?category=spot&symbol=PAXGUSDT", 5000);
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
    console.warn("Bybit gold price fetch failed, trying KuCoin...", err);
  }

  // 4. Try KuCoin PAXG/USDT (Highly permissive for cloud provider IPs)
  try {
    const response = await fetchWithTimeout("https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=PAXG-USDT", 5000);
    if (response.ok) {
      const data = await response.json();
      const price = Number(data?.data?.price);
      if (Number.isFinite(price) && price > 0) {
        return {
          symbol: "XAU/USD",
          price,
          currency: "USD",
          updatedAt: new Date().toISOString(),
          source: "KuCoin (PAXG-USDT)",
          configured: true,
        };
      }
    }
  } catch (err) {
    console.warn("KuCoin gold price fetch failed, trying Gate.io...", err);
  }

  // 5. Try Gate.io PAXG/USDT (Highly permissive for cloud provider IPs)
  try {
    const response = await fetchWithTimeout("https://api.gateio.ws/api/v4/spot/tickers?currency_pair=PAXG_USDT", 5000);
    if (response.ok) {
      const data = await response.json();
      const price = Number(data?.[0]?.last);
      if (Number.isFinite(price) && price > 0) {
        return {
          symbol: "XAU/USD",
          price,
          currency: "USD",
          updatedAt: new Date().toISOString(),
          source: "Gate.io (PAXG_USDT)",
          configured: true,
        };
      }
    }
  } catch (err) {
    console.warn("Gate.io gold price fetch failed, trying CoinGecko...", err);
  }

  // 6. Try CoinGecko PAX Gold (Free api, no key, cloud permissive)
  try {
    const response = await fetchWithTimeout("https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd", 5000);
    if (response.ok) {
      const data = await response.json();
      const price = Number(data?.["pax-gold"]?.usd);
      if (Number.isFinite(price) && price > 0) {
        return {
          symbol: "XAU/USD",
          price,
          currency: "USD",
          updatedAt: new Date().toISOString(),
          source: "CoinGecko (PAXG)",
          configured: true,
        };
      }
    }
  } catch (err) {
    console.warn("CoinGecko gold price fetch failed, trying Metalprice API...", err);
  }

  // 7. Fallback to Metalprice API (using configured env key or user key)
  const apiKey = process.env.METALPRICE_API_KEY || "50daaf9ca411c00d37dc1d36f851e76e";
  try {
    const response = await fetchWithTimeout(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=EUR,XAU,XAG`, 5000);
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
    price: 2385.50, // Realistic estimated backup price to prevent UI loading stuck and AI old price hallucinations
    currency: "USD",
    updatedAt: new Date().toISOString(),
    source: "Technical fallback (Estimated Price)",
    configured: false,
  };
}
