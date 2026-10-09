import { Router } from "express";

const KMB_BASE = "https://data.etabus.gov.hk/v1/transport/kmb";

const router = Router();

async function proxyKmb(path: string): Promise<unknown> {
  const url = `${KMB_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`KMB API error: ${res.status}`);
  return res.json();
}

router.get("/kmb/eta/:stopId/:route/:serviceType", async (req, res) => {
  try {
    const { stopId, route, serviceType } = req.params;
    const data = await proxyKmb(`/eta/${stopId}/${route}/${serviceType}`);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "KMB proxy error");
    res.status(502).json({ error: "Failed to fetch from KMB API" });
  }
});

export default router;
