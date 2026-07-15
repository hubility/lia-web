import { describe, expect, it } from "vitest";
import {
  buildScheduleTicks,
  clampScheduleOffset,
  normalizeClinicSchedule,
  parseClockInput,
} from "../lib/agenda/schedule";

const schedule = { opensAtMinutes: 8 * 60, closesAtMinutes: 19 * 60 };

describe("clinic schedule", () => {
  it("keeps a one-hour preview fully inside the lower calendar boundary", () => {
    expect(clampScheduleOffset(11 * 60, 60, schedule)).toBe(10 * 60);
    expect(clampScheduleOffset(10 * 60 + 45, 60, schedule)).toBe(10 * 60);
  });

  it("supports quarter-hour boundaries without losing whole-hour grid ticks", () => {
    const ticks = buildScheduleTicks({ opensAtMinutes: 8 * 60 + 30, closesAtMinutes: 19 * 60 });
    expect(ticks[0]).toEqual({ offsetMinutes: 0, label: "08:30" });
    expect(ticks[1]).toEqual({ offsetMinutes: 30, label: "09:00" });
    expect(ticks.at(-1)).toEqual({ offsetMinutes: 10 * 60 + 30, label: "19:00" });
  });

  it("falls back to the clinic default for invalid persisted ranges", () => {
    expect(normalizeClinicSchedule({ opensAtMinutes: 1200, closesAtMinutes: 600 })).toEqual(
      schedule
    );
  });

  it("parses valid time controls and rejects malformed values", () => {
    expect(parseClockInput("19:00")).toBe(19 * 60);
    expect(parseClockInput("24:00")).toBeNull();
    expect(parseClockInput("9:00")).toBeNull();
  });
});
