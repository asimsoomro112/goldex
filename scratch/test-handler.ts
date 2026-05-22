import handler from "../api/deposit-status";

async function runTest() {
  console.log("Simulating API request for live BSC transaction verification...");
  
  // Real transaction parameters found in live scanning
  const txHash = "0xc961dc03f8d40dc591a8466ea96425852b32a9518492fa866bbb9959e2710f38";
  const expectedTo = "0x7219a2034591274a82eea0ae24f7b472ea5842c9";
  const expectedAmount = "51.31385833";

  const req = {
    method: "GET",
    query: {
      txHash,
      to: expectedTo,
      amount: expectedAmount
    }
  };

  let statusCode = 200;
  let responseData: any = null;

  const res = {
    setHeader: (key: string, value: string) => {
      // console.log(`Header set: ${key} = ${value}`);
    },
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    }
  };

  await handler(req, res);

  console.log("\n==========================================");
  console.log(`[API RESPONSE] HTTP Status: ${statusCode}`);
  console.log(JSON.stringify(responseData, null, 2));
  console.log("==========================================");

  if (statusCode === 200 && responseData.status === "confirmed") {
    console.log("🎉 SUCCESS: API handler successfully verified the transaction and confirmed it!");
  } else {
    console.error("❌ FAILED: API handler response status was not confirmed.");
  }
}

runTest().catch(console.error);
