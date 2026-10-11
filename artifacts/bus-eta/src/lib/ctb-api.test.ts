import assert from "node:assert/strict";
import test from "node:test";
import { getGmbEta } from "./ctb-api.ts";

const timestamp = "2026-10-11T15:45:00+08:00";
const payload = {
  data: [{
    route_id: 2006738, route_seq: 1, stop_seq: 21, enabled: true,
    eta: [{ eta_seq: 1, diff: 5, timestamp, remarks_tc: null, remarks_en: null }],
  }, {
    route_id: 2006508, route_seq: 1, stop_seq: 10, enabled: true,
    eta: [{ eta_seq: 1, diff: 5, timestamp, remarks_tc: "未開出", remarks_en: "Scheduled" }],
  }],
};

async function withFetch(mock: typeof fetch, run: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try { await run(); } finally { globalThis.fetch = original; }
}

test("GMB uses the official endpoint and shares one request across routes", async () => {
  const urls: string[] = [];
  await withFetch(async (url) => {
    urls.push(String(url));
    return Response.json(payload);
  }, async () => {
    const [route31, route28S] = await Promise.all([
      getGmbEta(20000018, 2006738, "銅鑼灣(謝斐道)", "Causeway Bay (Jaffe Rd)"),
      getGmbEta(20000018, 2006508, "銅鑼灣(新會道)", "Causeway Bay (New Praya)"),
    ]);
    assert.deepEqual(urls, ["https://data.etagmb.gov.hk/eta/stop/20000018"]);
    assert.equal(route31[0].eta, timestamp);
    assert.equal(route31[0].dest_tc, "銅鑼灣(謝斐道)");
    assert.equal(route31[0].dir, "1");
    assert.equal(route31[0].rmk_tc, "");
    assert.equal(route28S[0].rmk_tc, "未開出");
  });
});

test("GMB falls back to the proxy after a direct network failure", async () => {
  const urls: string[] = [];
  await withFetch(async (url) => {
    urls.push(String(url));
    if (urls.length === 1) throw new TypeError("Network unavailable");
    return Response.json(payload);
  }, async () => {
    assert.equal((await getGmbEta(20000018, 2006738, "銅鑼灣", "Causeway Bay")).length, 1);
    assert.deepEqual(urls, ["https://data.etagmb.gov.hk/eta/stop/20000018", "/api/gmb/eta/stop/20000018"]);
  });
});

test("a failed stop request rejects and does not prevent a subsequent refresh", async () => {
  await withFetch(async () => Response.json({}, { status: 502 }), async () => {
    await assert.rejects(getGmbEta(20000018, 2006738, "銅鑼灣", "Causeway Bay"), /HTTP 502/);
  });
  await withFetch(async () => Response.json(payload), async () => {
    assert.equal((await getGmbEta(20000018, 2006738, "銅鑼灣", "Causeway Bay")).length, 1);
  });
});

test("empty, disabled and missing route forecasts do not invent departures", async () => {
  await withFetch(async () => Response.json({ data: [
    { ...payload.data[0], enabled: false },
    { ...payload.data[1], eta: [] },
  ] }), async () => {
    const entries = await Promise.all([
      getGmbEta(20000018, 2006738, "銅鑼灣", "Causeway Bay"),
      getGmbEta(20000018, 2006508, "銅鑼灣", "Causeway Bay"),
      getGmbEta(20000018, 999, "銅鑼灣", "Causeway Bay"),
    ]);
    assert.deepEqual(entries, [[], [], []]);
  });
});

test("a successful response is not retained across later refreshes", async () => {
  let calls = 0;
  await withFetch(async () => {
    calls++;
    return Response.json(calls === 1 ? payload : { data: [] });
  }, async () => {
    assert.equal((await getGmbEta(20000018, 2006738, "銅鑼灣", "Causeway Bay")).length, 1);
    assert.equal((await getGmbEta(20000018, 2006738, "銅鑼灣", "Causeway Bay")).length, 0);
    assert.equal(calls, 2);
  });
});
