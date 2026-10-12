import React from "react";
import { useQueries } from "@tanstack/react-query";
import { getCtbEta, getKmbEta, getGmbEta, getStopDetail, type EtaEntry } from "@/lib/ctb-api";
import { formatEta, formatTime, minutesUntil } from "@/lib/utils";

// ─── Config ──────────────────────────────────────────────────────────────────

const REFRESH_MS = 15_000;

// Shared bus/mini-bus stop location
const CTB_STOP_ID = "001016";        // CTB stop — 鴨巴甸街, 堅道
const KMB_103_STOP_ID = "2ECC1DBA0C28E93C"; // KMB stop — 鴨巴甸街, 堅道, 往竹園邨
const GMB_STOP_ID = 20000018;         // GMB stop — 堅道, 城皇街
const GMB_ROUTE_ID = 2006738;         // GMB route 31 route_id

interface RouteSource {
  key: string;
  displayRoute: string;
  type: "bus" | "minibus";
  etaDirection?: "I" | "O";
  fetchFn: () => Promise<EtaEntry[]>;
}

const ABERDEEN_ROUTES: RouteSource[] = [
  {
    key: "ctb-13",
    displayRoute: "13",
    type: "bus",
    fetchFn: () => getCtbEta("CTB", "002733", "13"),
  },
  {
    key: "ctb-40m",
    displayRoute: "40M",
    type: "bus",
    fetchFn: () => getCtbEta("CTB", CTB_STOP_ID, "40M"),
  },
  {
    key: "ctb-103",
    displayRoute: "103",
    type: "bus",
    etaDirection: "O", // CTB outbound is toward 竹園邨.
    fetchFn: () => getCtbEta("CTB", CTB_STOP_ID, "103"),
  },
  {
    key: "kmb-103",
    displayRoute: "103",
    type: "bus",
    etaDirection: "I", // KMB uses the opposite direction code for the same destination.
    fetchFn: () => getKmbEta(KMB_103_STOP_ID, "103", 1),
  },
  {
    key: "gmb-10",
    displayRoute: "10",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, 2006706, "謝斐道", "Jaffe Road"),
  },
  {
    key: "gmb-28",
    displayRoute: "28",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, 2006476, "銅鑼灣(新會道)", "Causeway Bay (New Praya)"),
  },
  {
    key: "gmb-28s",
    displayRoute: "28S",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, 2006508, "銅鑼灣(新會道)", "Causeway Bay (New Praya)"),
  },
  {
    key: "gmb-22a",
    displayRoute: "22",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, 2000997, "中環(交易廣場)", "Central (Exchange Square)"),
  },
  {
    key: "gmb-22b",
    displayRoute: "22",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, 2003045, "中環(交易廣場)", "Central (Exchange Square)"),
  },
  {
    key: "gmb-22sa",
    displayRoute: "22S",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, 2000999, "中環(中環碼頭)", "Central (Ferry Piers)"),
  },
  {
    key: "gmb-22sb",
    displayRoute: "22S",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, 2003050, "中環(中環碼頭)", "Central (Ferry Piers)"),
  },
  {
    key: "gmb-31",
    displayRoute: "31",
    type: "minibus",
    fetchFn: () => getGmbEta(GMB_STOP_ID, GMB_ROUTE_ID, "銅鑼灣(謝斐道)", "Causeway Bay (Jaffe Rd)"),
  },
];

interface Station {
  id: string;
  label: string;
  name: string;
  ctbStopId: string;
  routes: RouteSource[];
}

const STATIONS: Station[] = [
  {
    id: "aberdeen",
    label: "鴨巴甸街",
    name: "鴨巴甸街, 堅道",
    ctbStopId: CTB_STOP_ID,
    routes: ABERDEEN_ROUTES,
  },
  {
    id: "ladder",
    label: "樓梯街",
    name: "樓梯街, 堅道",
    ctbStopId: "001015",
    routes: [
      { key: "ctb-103", displayRoute: "103", type: "bus", etaDirection: "O",
        fetchFn: () => getCtbEta("CTB", "001015", "103") },
      { key: "kmb-103", displayRoute: "103", type: "bus", etaDirection: "I",
        fetchFn: () => getKmbEta("7D77D56CB708BCED", "103", 1) },
      { key: "ctb-40m", displayRoute: "40M", type: "bus", etaDirection: "O",
        fetchFn: () => getCtbEta("CTB", "001015", "40M") },
      { key: "gmb-31", displayRoute: "31", type: "minibus",
        fetchFn: () => getGmbEta(20000017, 2006738, "銅鑼灣(謝斐道)", "Causeway Bay (Jaffe Road)") },
    ],
  },
];

// ─── Extended entry type ──────────────────────────────────────────────────────

interface RichEtaEntry extends EtaEntry {
  displayRoute: string;
  type: "bus" | "minibus";
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useStopDetail(station: Station) {
  return useQueries({
    queries: [{
      queryKey: ["stop-detail", station.ctbStopId],
      queryFn: () => getStopDetail(station.ctbStopId),
      staleTime: 60 * 60_000,
    }],
  })[0];
}

function useAllEtas(station: Station) {
  return useQueries({
    queries: station.routes.map((src) => ({
      queryKey: ["eta", station.id, src.key],
      queryFn: src.fetchFn,
      refetchInterval: REFRESH_MS,
      staleTime: 10_000,
      retry: 2,
    })),
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type RouteStatus = "ready" | "loading" | "unavailable" | "error";

function RouteBadge({ type, label, status = "ready" }: {
  type: "bus" | "minibus";
  label: string;
  status?: RouteStatus;
}) {
  const isMinibus = type === "minibus";
  const statusLabel = {
    ready: "已有到站預報",
    loading: "載入中",
    unavailable: "暫未提供到站預報",
    error: "連線失敗，正在重試",
  }[status];
  const colors = status === "error"
    ? "bg-orange-100 text-orange-800 border-orange-500"
    : status === "loading" || status === "unavailable"
      ? "bg-stone-200 text-stone-600 border-stone-400"
      : isMinibus
        ? "bg-foreground text-background border-foreground"
        : "bg-transparent text-foreground border-foreground";
  return (
    <span
      data-status={status}
      title={statusLabel}
      aria-label={`${isMinibus ? "小巴" : "巴士"} ${label}：${statusLabel}`}
      className={`font-mono text-sm tracking-tight leading-none px-2 py-1 shrink-0 min-w-[44px] text-center border ${colors}`}
    >
      {label}
    </span>
  );
}

function EtaRow({ entry }: { entry: RichEtaEntry }) {
  const mins = minutesUntil(entry.eta);
  const isArriving = mins !== null && mins <= 1;

  return (
    <div className="grid grid-cols-[1fr_auto] gap-4 py-3 border-b border-muted-foreground/30 items-center">
      <div className="flex flex-row items-center gap-3 min-w-0">
        <RouteBadge type={entry.type} label={entry.displayRoute} />
        <div className="min-w-0 flex flex-col">
          <div className="text-foreground font-bold text-base tracking-tight truncate leading-tight">
            {entry.dest_tc || entry.dest_en}
          </div>
          {entry.rmk_tc && entry.rmk_tc !== "原定班次" && entry.rmk_tc !== "未開出" && (
            <div className="text-muted-foreground text-xs uppercase tracking-widest font-mono">
              {entry.rmk_tc}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end shrink-0">
        <div
          className={`font-mono font-bold text-2xl tabular-nums tracking-tighter leading-none ${
            isArriving ? "text-accent" : "text-foreground"
          }`}
        >
          {formatEta(entry.eta)}
        </div>
        {entry.eta && (
          <div className="text-muted-foreground font-mono text-xs tabular-nums uppercase tracking-widest">
            {formatTime(entry.eta)}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] gap-4 py-3 border-b border-muted-foreground/30 items-center"
        >
          <div className="flex flex-row items-center gap-3">
            <div className="w-[44px] h-[26px] bg-muted animate-pulse" />
            <div className="h-5 w-36 bg-muted animate-pulse" />
          </div>
          <div className="h-7 w-20 bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function NoBusRow() {
  return (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <span className="font-mono text-sm uppercase tracking-widest">No departures</span>
    </div>
  );
}

// ─── Sync button ─────────────────────────────────────────────────────────────

function SyncButton({
  onClick,
  disabled,
  isFetching,
}: {
  onClick: () => void;
  disabled: boolean;
  isFetching: boolean;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Refresh"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative overflow-hidden border border-foreground font-mono text-xs tracking-[0.2em] uppercase px-3 py-[3px] disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {/* Wipe fill */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "hsl(var(--foreground))",
          transform: hovered ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      {/* Content */}
      <span
        className="relative z-10 flex items-center gap-1.5"
        style={{
          color: hovered ? "hsl(var(--background))" : "hsl(var(--foreground))",
          transition: "color 0.15s",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-3 h-3 shrink-0 ${isFetching ? "animate-spin" : ""}`}
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
        {isFetching ? "Sync…" : "Sync"}
      </span>
    </button>
  );
}

// ─── Main board ──────────────────────────────────────────────────────────────

export default function BusBoard() {
  const [selectedId, setSelectedId] = React.useState(STATIONS[0].id);
  const station = STATIONS.find((item) => item.id === selectedId)!;

  function handleTabKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % STATIONS.length;
    else if (event.key === "ArrowLeft") next = (index + STATIONS.length - 1) % STATIONS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = STATIONS.length - 1;
    else return;
    event.preventDefault();
    setSelectedId(STATIONS[next].id);
    document.getElementById(`station-tab-${STATIONS[next].id}`)?.focus();
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 selection:bg-foreground selection:text-background">
      <div role="tablist" aria-label="選擇車站" className="flex gap-2 mb-4 border-b border-muted-foreground/30 pb-3">
        {STATIONS.map((item, index) => (
          <button key={item.id} id={`station-tab-${item.id}`} role="tab"
            type="button" aria-selected={selectedId === item.id}
            aria-controls={`station-panel-${item.id}`} tabIndex={selectedId === item.id ? 0 : -1}
            onClick={() => setSelectedId(item.id)} onKeyDown={(event) => handleTabKey(event, index)}
            className={`flex-1 sm:flex-none border px-4 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
              selectedId === item.id ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-muted-foreground/40"
            }`}>
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`station-panel-${station.id}`} aria-labelledby={`station-tab-${station.id}`}>
        <StationBoard key={station.id} station={station} />
      </div>
    </div>
  );
}

function StationBoard({ station }: { station: Station }) {
  const stopQuery = useStopDetail(station);
  const etaQueries = useAllEtas(station);

  const stopName = stopQuery.data?.name_tc ?? stopQuery.data?.name_en ?? station.name;
  const isLoading = etaQueries.some((q) => q.isLoading);
  const isError = etaQueries.every((q) => q.isError);
  const isFetching = etaQueries.some((q) => q.isFetching);

  function getRouteStatus(route: string): RouteStatus {
    const sources = station.routes
      .map((src, i) => ({ src, query: etaQueries[i] }))
      .filter(({ src }) => src.displayRoute === route);
    if (sources.some(({ src, query }) => !query.isError &&
      (query.data ?? []).some((entry) => entry.eta &&
        (!src.etaDirection || entry.dir === src.etaDirection)))) return "ready";
    if (sources.some(({ query }) => query.isLoading)) return "loading";
    if (sources.some(({ query }) => query.isError)) return "error";
    return "unavailable";
  }

  function refetchAll() {
    etaQueries.forEach((q) => q.refetch());
  }

  // Tick every second so staleness updates live
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const lastUpdatedAt = Math.max(...etaQueries.map((q) => q.dataUpdatedAt ?? 0));
  const lastUpdated = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;
  const secondsStale = lastUpdatedAt ? Math.floor((now - lastUpdatedAt) / 1000) : null;
  const isStale = !isFetching && secondsStale !== null && secondsStale > 20;

  // Merge all ETA entries — deduplicate by route+ETA timestamp, sort by arrival
  const seen = new Set<string>();
  const allEntries: RichEtaEntry[] = [];

  etaQueries.forEach((q, i) => {
    const src = station.routes[i];
    (q.data ?? []).forEach((entry) => {
      if (src.etaDirection && entry.dir !== src.etaDirection) return;
      if (!entry.eta) return;
      const key = `${src.displayRoute}-${entry.eta}`;
      if (seen.has(key)) return;
      seen.add(key);
      allEntries.push({ ...entry, displayRoute: src.displayRoute, type: src.type });
    });
  });

  allEntries.sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime());

  // Unique routes for the header (in display order, no duplicates)
  const headerRoutes: RouteSource[] = [];
  const seen2 = new Set<string>();
  for (const src of station.routes) {
    if (!seen2.has(src.displayRoute)) {
      seen2.add(src.displayRoute);
      headerRoutes.push(src);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="flex flex-row items-end justify-between pb-3 border-b-2 border-accent">
        <div className="flex flex-col gap-0.5">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Station / 站
          </div>
          <h1 className="font-bold text-2xl tracking-tight leading-none text-foreground">
            {stopName}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <SyncButton onClick={refetchAll} disabled={isFetching} isFetching={isFetching} />
          <LiveClock />
        </div>
      </header>

      {/* List */}
      <main className="flex-1 flex flex-col mt-3">
        {/* Route summary strip */}
        <div className="flex items-center gap-3 pb-2 border-b border-muted-foreground/30">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground shrink-0">
            Monitoring {headerRoutes.length} routes
          </span>
          <div className="flex flex-wrap gap-1.5 flex-1">
            {headerRoutes.map((src) => (
              <RouteBadge key={src.key} type={src.type} label={src.displayRoute}
                status={getRouteStatus(src.displayRoute)} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-4 pb-2 mt-2 border-b border-foreground items-end font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="w-[44px] text-center">Line</span>
            <span>Destination</span>
          </div>
          <span className="text-right">Depart</span>
        </div>

        <div className="flex flex-col">
          {isLoading ? (
            <LoadingRow />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <p className="font-mono text-2xl uppercase tracking-widest">System Error</p>
            </div>
          ) : allEntries.length === 0 ? (
            <NoBusRow />
          ) : (
            allEntries.map((entry) => (
              <EtaRow
                key={`${entry.displayRoute}-${entry.eta_seq}-${entry.eta}`}
                entry={entry}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-4 pt-3 border-t border-muted-foreground/30 flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className={isFetching ? "animate-pulse" : ""}>
            Status: {isFetching ? "Syncing" : "Active"}
          </span>
          {lastUpdated && (
            <span className={isStale ? "text-destructive" : ""}>
              {isStale
                ? `Stale · ${secondsStale}s ago`
                : `Updated: ${lastUpdated}`}
            </span>
          )}
        </div>
        <span>Data: TD / CTB / KMB</span>
      </footer>
    </div>
  );
}

// ─── Live clock ──────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Current Time
      </div>
      <div className="font-mono font-bold text-2xl tabular-nums tracking-tighter leading-none text-foreground">
        {time.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
    </div>
  );
}
