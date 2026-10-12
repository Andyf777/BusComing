import test from "node:test";
import assert from "node:assert/strict";
import { getShuttleDepartures } from "./shuttle.ts";

function times(at: string) {
  return getShuttleDepartures(new Date(at)).map((entry) =>
    new Date(new Date(entry.eta!).getTime() + 8 * 60 * 60_000).toISOString().slice(11, 16));
}

test("weekday evening and peak departures follow the supplied GPVH column", () => {
  assert.deepEqual(times("2026-10-12T20:32:00+08:00"), ["21:00", "21:30", "22:00"]);
  assert.deepEqual(times("2026-10-12T16:10:00+08:00"), ["16:20", "16:40", "17:00"]);
});
test("Saturday, Sunday and weekday public holidays use the correct first service", () => {
  assert.equal(times("2026-10-17T06:00:00+08:00")[0], "06:30");
  assert.equal(times("2026-10-18T06:00:00+08:00")[0], "07:00");
  assert.equal(times("2026-01-01T06:00:00+08:00")[0], "07:00");
});
test("Hong Kong date works independently of the device timezone", () => {
  assert.equal(times("2026-10-17T22:00:00Z")[0], "07:00");
});
test("departed services disappear and no later service is invented", () => {
  assert.deepEqual(times("2026-10-12T23:00:00+08:00"), ["23:00"]);
  assert.deepEqual(times("2026-10-12T23:00:01+08:00"), []);
  assert.deepEqual(times("2028-01-01T06:00:00+08:00"), []);
});
test("entries identify scheduled departure and correct destination", () => {
  const entries = getShuttleDepartures(new Date("2026-10-12T20:32:00+08:00"));
  assert.equal(entries.length, 3);
  assert.ok(entries.every((e) => e.co === "SHUTTLE" && e.dest_tc === "港鐵荃灣站" && e.rmk_tc.includes("時間表班次")));
});
