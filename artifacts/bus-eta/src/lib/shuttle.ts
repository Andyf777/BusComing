import type { EtaEntry } from "./ctb-api";

// Printed timetable supplied by the user, effective 1 October 2023.
// Only the GPVH departure columns toward Tsuen Wan MTR are included.
function timetableRange(start: number, end: number, interval: number): string[] {
  const times: string[] = [];
  for (let minutes = start; minutes <= end; minutes += interval) {
    times.push(`${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
  }
  return times;
}

export const SHUTTLE_TIMETABLE = [
  { label: "星期一至五", times: [
    ...timetableRange(390, 540, 15),
    ...timetableRange(570, 960, 30),
    ...timetableRange(980, 1200, 20),
    ...timetableRange(1230, 1380, 30),
  ] },
  { label: "星期六", times: [
    ...timetableRange(390, 540, 15),
    ...timetableRange(570, 1380, 30),
  ] },
  { label: "星期日及公眾假期", times: timetableRange(420, 1380, 30) },
];


// Official 1823 public holiday calendar, retrieved 12 October 2026.
// https://www.1823.gov.hk/common/ical/tc.json
const PUBLIC_HOLIDAYS = new Set(["20250101", "20250129", "20250130", "20250131", "20250404", "20250418", "20250419", "20250421", "20250501", "20250505", "20250531", "20250701", "20251001", "20251007", "20251029", "20251225", "20251226", "20260101", "20260217", "20260218", "20260219", "20260403", "20260404", "20260406", "20260407", "20260501", "20260525", "20260619", "20260701", "20260926", "20261001", "20261019", "20261225", "20261226", "20270101", "20270206", "20270208", "20270209", "20270326", "20270327", "20270329", "20270405", "20270501", "20270513", "20270609", "20270701", "20270916", "20271001", "20271008", "20271225", "20271227"]);

export function getShuttleDepartures(now = new Date()): EtaEntry[] {
  // Hong Kong has no daylight saving time; use UTC accessors after shifting.
  const hk = new Date(now.getTime() + 8 * 60 * 60_000);
  const year = hk.getUTCFullYear();
  // Avoid guessing public holidays beyond the verified calendar coverage.
  if (year < 2025 || year > 2027) return [];
  const date = `${year}-${String(hk.getUTCMonth() + 1).padStart(2, "0")}-${String(hk.getUTCDate()).padStart(2, "0")}`;
  const holiday = PUBLIC_HOLIDAYS.has(date.replaceAll("-", ""));
  const day = hk.getUTCDay();
  const schedule = SHUTTLE_TIMETABLE[holiday || day === 0 ? 2 : day === 6 ? 1 : 0];
  return schedule.times
    .map((time) => new Date(`${date}T${time}:00+08:00`).toISOString())
    .filter((time) => new Date(time).getTime() >= now.getTime())
    .slice(0, 3)
    .map((eta, index) => ({
      co: "SHUTTLE", route: "穿梭", dir: "O",
      dest_tc: "港鐵荃灣站", dest_en: "Tsuen Wan MTR Station",
      eta_seq: index + 1, eta,
      rmk_tc: "時間表班次 · 浪／海琴軒開出", rmk_en: "Scheduled departure from GPVH",
      data_timestamp: now.toISOString(),
    }));
}
