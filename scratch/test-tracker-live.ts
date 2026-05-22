import fetch from "node-fetch";

const BSC_NODE = "https://bsc-dataseed.binance.org/";

async function callRpc(method: string, params: any[]) {
  const response = await fetch(BSC_NODE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method,
      params,
      id: 1
    })
  });
  const json: any = await response.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runTest() {
  const latestBlockHex = await callRpc("eth_blockNumber", []);
  const latestBlock = parseInt(latestBlockHex, 16);
  console.log(`Latest block height: ${latestBlock}`);

  const targetContract = "0x55d398326f99059ff775485246999027b3197955"; // Corrected address (42 chars)
  
  // We will scan backwards from the latest block to find a block containing a USDT transfer
  for (let offset = 2; offset < 100; offset++) {
    const blockNum = latestBlock - offset;
    try {
      const block = await callRpc("eth_getBlockByNumber", ["0x" + blockNum.toString(16), true]);
      await sleep(100); // slight delay to be nice to the RPC
      
      if (block && block.transactions && block.transactions.length > 0) {
        for (const tx of block.transactions) {
          if (tx.to && tx.to.toLowerCase() === targetContract) {
            if (tx.input && tx.input.toLowerCase().startsWith("0xa9059cbb")) {
              console.log("\n==========================================");
              console.log(`[SUCCESS] Found live USDT transfer in block: ${blockNum}`);
              console.log(`Transaction Hash: ${tx.hash}`);
              console.log(`From (Sender):    ${tx.from}`);
              console.log(`To (Contract):    ${tx.to}`);
              console.log(`Raw Input Data:   ${tx.input.slice(0, 138)}...`);
              
              // Apply our decoder logic
              const recipient = "0x" + tx.input.slice(34, 74).toLowerCase();
              const rawValueHex = tx.input.slice(74, 138);
              const rawValue = BigInt("0x" + rawValueHex);
              const amount = Number(rawValue) / 1e18;

              console.log("\n[DECODER OUTPUT]");
              console.log(`Decoded Recipient Address: ${recipient}`);
              console.log(`Decoded Transfer Amount:   ${amount} USDT`);
              console.log("==========================================");
              return;
            }
          }
        }
      }
    } catch (e: any) {
      console.error(`Error scanning block ${blockNum}:`, e.message);
      await sleep(500);
    }
  }
  console.log("Could not find any USDT transactions in the scanned range. Please run the script again.");
}

runTest().catch(console.error);
