const BSC_CONFIRMATION_TARGET = 12;
const USDT_BSC_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
const BSC_PUBLIC_RPC_NODES = [
  "https://bsc-dataseed.binance.org/",
  "https://binance.llamarpc.com",
  "https://rpc.ankr.com/bsc",
  "https://bsc-dataseed1.defibit.io/",
  "https://bsc-dataseed1.ninicoin.io/"
];

async function callRpc(method: string, params: any[]) {
  let lastError = null;
  for (const node of BSC_PUBLIC_RPC_NODES) {
    try {
      const response = await fetch(node, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method,
          params,
          id: 1
        })
      });
      if (response.ok) {
        const json = await response.json();
        if (json && json.result !== undefined && !json.error) {
          return json.result;
        }
      }
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error(`All public RPC nodes failed for method: ${method}`);
}

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

  try {
    // 1. Fetch transaction details
    const tx = await callRpc("eth_getTransactionByHash", [txHash]);
    if (!tx) {
      return res.status(200).json({
        configured: true,
        txHash,
        status: "pending_or_not_found",
        confirmations: 0,
        targetConfirmations: BSC_CONFIRMATION_TARGET,
        message: "Transaction not found on BSC network yet."
      });
    }

    // 2. Fetch transaction receipt
    const receipt = await callRpc("eth_getTransactionReceipt", [txHash]);
    
    // 3. Fetch latest block number
    const latestBlockHex = await callRpc("eth_blockNumber", []);
    const currentBlock = parseHex(latestBlockHex);
    const blockNumber = parseHex(tx.blockNumber);
    
    const confirmations = blockNumber && currentBlock ? Math.max(0, currentBlock - blockNumber + 1) : 0;
    const isSuccess = receipt ? receipt.status === "0x1" : false;

    // Decode token transfer details
    let actualRecipient = "";
    let actualAmount = 0;
    const input = tx.input || "";
    const toContract = String(tx.to || "").toLowerCase();
    const isTokenContract = toContract === USDT_BSC_CONTRACT.toLowerCase();

    if (isTokenContract && input.length >= 138) {
      const signature = input.slice(0, 10);
      if (signature.toLowerCase() === "0xa9059cbb") {
        actualRecipient = "0x" + input.slice(34, 74).toLowerCase();
        const rawValueHex = input.slice(74, 138);
        const rawValue = BigInt("0x" + rawValueHex);
        actualAmount = Number(rawValue) / 1e18; // USDT on BSC is 18 decimals
      }
    }

    const matchesRecipient = expectedTo ? actualRecipient === expectedTo.toLowerCase() : true;
    const matchesAmount = expectedAmount > 0 ? Math.abs(actualAmount - expectedAmount) < 0.01 : true;

    let trackerStatus = "confirming";
    if (receipt) {
      if (isSuccess) {
        if (confirmations >= BSC_CONFIRMATION_TARGET) {
          trackerStatus = "confirmed";
        } else {
          trackerStatus = "confirming";
        }
      } else {
        trackerStatus = "failed";
      }
    } else {
      trackerStatus = "pending";
    }

    return res.status(200).json({
      configured: true,
      txHash,
      status: trackerStatus,
      confirmations,
      targetConfirmations: BSC_CONFIRMATION_TARGET,
      blockNumber,
      isTokenContract,
      matchesRecipient,
      matchesAmount,
      decodedTransfer: {
        to: actualRecipient,
        amount: actualAmount
      },
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Free RPC tracker error:", error);
    return res.status(500).json({ error: error.message || "Deposit verification failed." });
  }
}

function parseHex(value: any) {
  if (!value) return 0;
  const parsed = Number.parseInt(String(value), 16);
  return Number.isFinite(parsed) ? parsed : 0;
}
