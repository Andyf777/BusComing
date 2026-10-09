import { Router } from "express";

const GMB_BASE = "https://data.etagmb.gov.hk";

const router = Router();

async function proxyGmb(path: string): Promise<unknown> {
  const url = `${GMB_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`GMB API error: ${res.status}`);
  return res.json();
}

router.get("/gmb/eta/stop/:stopId", async (req, res) => {
  try {
    const { stopId } = req.params;
    const data = await proxyGmb(`/eta/stop/${stopId}`);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "GMB proxy error");
    res.status(502).json({ error: "Failed to fetch from GMB API" });
  }
});

export default router;
