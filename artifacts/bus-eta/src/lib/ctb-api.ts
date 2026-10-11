const CTB_BASE = "/api/ctb";
const KMB_BASE = "/api/kmb";
const GMB_BASE = "/api/gmb";
const GMB_DIRECT_BASE = "https://data.etagmb.gov.hk";

export interface RouteStop {
  co: string;
  route: string;
  dir: string;
  seq: number;
  stop: string;
  data_timestamp: string;
}

export interface StopDetail {
  stop: string;
  name_en: string;
  name_tc: string;
  lat: string;
  long: string;
  data_timestamp: string;
}

// Normalised ETA entry — used by all operators
export interface EtaEntry {
  co: string;
  route: string;
  dir: string;
  seq?: number;
  stop?: string;
  dest_tc: string;
  dest_en: string;
  eta_seq: number;
  eta: string | null;
  rmk_tc: string;
  rmk_en: string;
  data_timestamp: string;
}

// ─── GMB raw types ────────────────────────────────────────────────────────────

interface GmbEtaItem {
  eta_seq: number;
  diff: number;
  timestamp: string;
  remarks_tc: string | null;
  remarks_sc: string | null;
  remarks_en: string | null;
}

interface GmbRouteEta {
  route_id: number;
  route_seq: number;
  stop_seq: number;
  enabled: boolean;
  eta: GmbEtaItem[];
}

interface GmbStopEtaResponse {
  data: GmbRouteEta[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const json = await res.json();
  return json.data as T;
}

async function getRaw<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

// ─── CTB / NWFB ──────────────────────────────────────────────────────────────

export async function getRouteStops(
  company: string,
  route: string,
  dir: "inbound" | "outbound"
): Promise<RouteStop[]> {
  return get<RouteStop[]>(`${CTB_BASE}/route-stop/${company}/${route}/${dir}`);
}

export async function getStopDetail(stopId: string): Promise<StopDetail> {
  return get<StopDetail>(`${CTB_BASE}/stop/${stopId}`);
}

export async function getCtbEta(
  company: string,
  stopId: string,
  route: string
): Promise<EtaEntry[]> {
  return get<EtaEntry[]>(`${CTB_BASE}/eta/${company}/${stopId}/${route}`);
}

// ─── KMB ─────────────────────────────────────────────────────────────────────

export async function getKmbEta(
  stopId: string,
  route: string,
  serviceType = 1
): Promise<EtaEntry[]> {
  return get<EtaEntry[]>(`${KMB_BASE}/eta/${stopId}/${route}/${serviceType}`);
}

// ─── GMB ─────────────────────────────────────────────────────────────────────

// The official GMB endpoint supports browser CORS. Fetch it directly so a
// failed Pages-to-GMB connection does not hide every minibus route. Retain the
// same-origin proxy as a fallback and share concurrent requests for one stop.
const gmbStopRequests = new Map<number, Promise<GmbStopEtaResponse>>();

function getGmbStopEta(stopId: number): Promise<GmbStopEtaResponse> {
  const existing = gmbStopRequests.get(stopId);
  if (existing) return existing;

  const request = getRaw<GmbStopEtaResponse>(`${GMB_DIRECT_BASE}/eta/stop/${stopId}`)
    .catch(() => getRaw<GmbStopEtaResponse>(`${GMB_BASE}/eta/stop/${stopId}`))
    .finally(() => gmbStopRequests.delete(stopId));
  gmbStopRequests.set(stopId, request);
  return request;
}

export async function getGmbEta(
  stopId: number,
  routeId: number,
  destTc: string,
  destEn: string
): Promise<EtaEntry[]> {
  const res = await getGmbStopEta(stopId);
  const match = res.data.find((r) => r.route_id === routeId);
  if (!match || !match.enabled) return [];

  return match.eta.map((item): EtaEntry => ({
    co: "GMB",
    route: String(routeId),
    dir: String(match.route_seq),
    eta_seq: item.eta_seq,
    eta: item.timestamp || null,
    dest_tc: destTc,
    dest_en: destEn,
    rmk_tc: item.remarks_tc ?? "",
    rmk_en: item.remarks_en ?? "",
    data_timestamp: item.timestamp,
  }));
}
