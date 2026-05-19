export default function handler(_req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ 
    status: "ok",
    nodeVersion: process.version,
    envKeys: Object.keys(process.env).filter(k => !k.includes("KEY") && !k.includes("PASSWORD") && !k.includes("SECRET"))
  });
}
