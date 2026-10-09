import { Router } from "express";

const CTB_BASE = "https://rt.data.gov.hk/v2/transport/citybus";

const router = Router();

async function proxyCtb(path: string): Promise<unknown> {
  const url = `${CTB_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`CTB API error: ${res.status}`);
  return res.json();
}

router.get("/ctb/route-stop/:company/:route/:dir", async (req, res) => {
  try {
    const { company, route, dir } = req.params;
    const data = await proxyCtb(`/route-stop/${company}/${route}/${dir}`);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "CTB proxy error");
    res.status(502).json({ error: "Failed to fetch from CTB API" });
  }
});

router.get("/ctb/stop/:stopId", async (req, res) => {
  try {
    const { stopId } = req.params;
    const data = await proxyCtb(`/stop/${stopId}`);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "CTB proxy error");
    res.status(502).json({ error: "Failed to fetch from CTB API" });
  }
});

router.get("/ctb/eta/:company/:stopId/:route", async (req, res) => {
  try {
    const { company, stopId, route } = req.params;
    const data = await proxyCtb(`/eta/${company}/${stopId}/${route}`);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "CTB proxy error");
    res.status(502).json({ error: "Failed to fetch from CTB API" });
  }
});

export default router;
