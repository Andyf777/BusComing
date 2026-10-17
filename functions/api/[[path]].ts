// Cloudflare Pages Function: same-origin bus ETA API proxy.
// Restrict routes to known public transport endpoints; never proxy arbitrary URLs.
const patterns = [
  { re: /^ctb\/route-stop\/(CTB|NWFB)\/[A-Za-z0-9]+\/(inbound|outbound)$/i, upstream: "https://rt.data.gov.hk/v2/transport/citybus/" },
  { re: /^ctb\/stop\/[A-Za-z0-9]+$/, upstream: "https://rt.data.gov.hk/v2/transport/citybus/" },
  { re: /^ctb\/eta\/(CTB|NWFB)\/[A-Za-z0-9]+\/[A-Za-z0-9]+$/i, upstream: "https://rt.data.gov.hk/v2/transport/citybus/" },
  { re: /^kmb\/eta\/[A-Za-z0-9]+\/[A-Za-z0-9]+\/[0-9]+$/i, upstream: "https://data.etabus.gov.hk/v1/transport/kmb/" },
  { re: /^gmb\/eta\/stop\/[0-9]+$/, upstream: "https://data.etagmb.gov.hk/" },
];

export async function onRequestGet(context: { params: { path?: string | string[] }; request: Request }): Promise<Response> {
  const segments = context.params.path;
  const path = Array.isArray(segments) ? segments.join("/") : (segments ?? "");
  const match = patterns.find((item) => item.re.test(path));
  if (!match) {
    return Response.json({ error: "Unknown API endpoint" }, { status: 404 });
  }
  const upstreamPath = path.replace(/^(ctb|kmb|gmb)\//, "");
  try {
    const response = await fetch(match.upstream + upstreamPath, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 10, cacheEverything: true },
    } as RequestInit);
    if (!response.ok) return Response.json({ error: "Transport data unavailable" }, { status: 502 });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=10",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Transport data unavailable" }, { status: 502 });
  }
}
