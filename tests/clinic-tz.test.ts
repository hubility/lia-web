import { describe, it, expect } from "vitest";
import { utcToWallClock, wallClockToUtc } from "../lib/clinic-tz";

// Fortaleza es UTC−3 sin horario de verano: 08:00 local = 11:00 UTC.
describe("clinic-tz", () => {
  it("wallClockToUtc: 08:00 Fortaleza → 11:00 UTC", () => {
    const utc = wallClockToUtc(2026, 6, 2, 8, 0);
    expect(utc.toISOString()).toBe("2026-06-02T11:00:00.000Z");
  });

  it("utcToWallClock: 11:00 UTC → 08:00 Fortaleza, martes", () => {
    const wall = utcToWallClock(new Date("2026-06-02T11:00:00Z"));
    expect(wall).toMatchObject({ y: 2026, m: 6, d: 2, hour: 8, minute: 0, weekday: 2 });
  });

  it("ida y vuelta es estable", () => {
    const utc = wallClockToUtc(2026, 6, 2, 14, 30);
    const wall = utcToWallClock(utc);
    expect(wall).toMatchObject({ y: 2026, m: 6, d: 2, hour: 14, minute: 30 });
  });

  it("domingo se detecta como weekday 0", () => {
    const wall = utcToWallClock(wallClockToUtc(2026, 6, 7, 10, 0)); // 2026-06-07 = domingo
    expect(wall.weekday).toBe(0);
  });
});
