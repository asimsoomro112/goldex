import "dotenv/config";

const BSC_CONFIRMATION_TARGET = 15;
const USDT_BSC_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const txHash = String(req.query?.txHash || "").trim();
  const expectedTo = String(req.query?.to || "").trim().toLowerCase();
  const expectedAmount = Number(req.query?.amount || 0);

  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return res.status(400).json({ error: "Valid transaction hash is required." });
  }

  const apiKey = process.env.BSCSCAN_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      configured: false,
      txHash,
      status: "unconfigured",
      confirmations: 0,
      targetConfirmations: BSC_CONFIRMATION_TARGET,
    });
  }

  try {
    const tx = await fetchJson("https://api.bscscan.com/api", {
      module: "proxy",
      action: "eth_getTransactionByHash",
      txhash: txHash,
      apikey: apiKey,
    });
    const receipt = await fetchJson("https://api.bscscan.com/api", {
      module: "proxy",
      action: "eth_getTransactionReceipt",
      txhash: txHash,
      apikey: apiKey,
    });
    const latestBlock = await fetchJson("https://api.bscscan.com/api", {
      module: "proxy",
      action: "eth_blockNumber",
      apikey: apiKey,
    });

    const blockNumber = parseHex(tx?.result?.blockNumber);
    const currentBlock = parseHex(latestBlock?.result);
    const confirmations = blockNumber && currentBlock ? Math.max(0, currentBlock - blockNumber + 1) : 0;
    const success = receipt?.result?.status === "0x1";
    const to = String(tx?.result?.to || "").toLowerCase();
    const isTokenContract = to === USDT_BSC_CONTRACT.toLowerCase();
    const matchesRecipient = expectedTo ? JSON.stringify(tx?.result || {}).toLowerCase().includes(expectedTo) : null;
    const amountCheck = expectedAmount > 0 ? "manual_token_decode_required" : "not_requested";

    return res.status(200).json({
      configured: true,
      txHash,
      status: success ? (confirmations >= BSC_CONFIRMATION_TARGET ? "confirmed" : "confirming") : "failed_or_pending",
      confirmations,
      targetConfirmations: BSC_CONFIRMATION_TARGET,
      blockNumber,
      isTokenContract,
      matchesRecipient,
      amountCheck,
      checkedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Deposit status lookup failed." });
  }
}

async function fetchJson(baseUrl: string, params: Record<string, string>) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url);
  if (!response.ok) throw new Error("BscScan request failed.");
  return response.json();
}

function parseHex(value: any) {
  if (!value) return 0;
  const parsed = Number.parseInt(String(value), 16);
  return Number.isFinite(parsed) ? parsed : 0;
}
