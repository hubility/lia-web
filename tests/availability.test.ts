import { describe, it, expect } from "vitest";
import { findFreeSlots } from "../lib/agenda/availability";

// Helpers para construir los objetos mínimos que espera findCollision.
function appt(startsAtIso: string, durationMinutes: number, id = "a1") {
  return { id, startsAt: new Date(startsAtIso), durationMinutes, title: "X", status: "scheduled" as const };
}
function block(startsAtIso: string, endsAtIso: string, id = "b1") {
  return {
    id,
    startsAt: new Date(startsAtIso),
    endsAt: new Date(endsAtIso),
    kind: "lunch" as const,
    label: "Almoço",
  };
}

// Martes 2026-06-02. Fortaleza UTC−3: 08:00–19:00 local = 11:00Z–22:00Z.
const FROM = new Date("2026-06-02T00:00:00Z");
const TO = new Date("2026-06-02T23:59:00Z");

describe("findFreeSlots", () => {
  it("día vacío, duración 60 → 11 slots cada hora desde 08:00 Fortaleza (11:00Z)", () => {
    const slots = findFreeSlots({
      from: FROM,
      to: TO,
      durationMinutes: 60,
      appointments: [],
      timeBlocks: [],
    });
    expect(slots).toHaveLength(11);
    expect(slots[0].toISOString()).toBe("2026-06-02T11:00:00.000Z");
    expect(slots[slots.length - 1].toISOString()).toBe("2026-06-02T21:00:00.000Z"); // 18:00 local
  });

  it("el paso es la duración del servicio (90min)", () => {
    const slots = findFreeSlots({
      from: FROM,
      to: TO,
      durationMinutes: 90,
      appointments: [],
      timeBlocks: [],
    });
    // 08:00,09:30,11:00,12:30,14:00,15:30,17:00 (termina 18:30) → 7.
    expect(slots).toHaveLength(7);
    expect(slots[0].toISOString()).toBe("2026-06-02T11:00:00.000Z");
  });

  it("excluye el candidato que choca con una cita existente", () => {
    const slots = findFreeSlots({
      from: FROM,
      to: TO,
      durationMinutes: 60,
      appointments: [appt("2026-06-02T12:00:00Z", 60)], // 09:00 local
      timeBlocks: [],
    });
    expect(slots).toHaveLength(10);
    expect(slots.map((s) => s.toISOString())).not.toContain("2026-06-02T12:00:00.000Z");
  });

  it("excluye candidatos que chocan con un TimeBlock (almuerzo)", () => {
    const slots = findFreeSlots({
      from: FROM,
      to: TO,
      durationMinutes: 60,
      appointments: [],
      timeBlocks: [block("2026-06-02T15:00:00Z", "2026-06-02T16:00:00Z")], // 12:00–13:00 local
    });
    expect(slots.map((s) => s.toISOString())).not.toContain("2026-06-02T15:00:00.000Z");
    expect(slots).toHaveLength(10);
  });

  it("no genera slots que se pasen del cierre (19:00)", () => {
    const slots = findFreeSlots({
      from: FROM,
      to: TO,
      durationMinutes: 60,
      appointments: [],
      timeBlocks: [],
    });
    const after19 = slots.filter((s) => s.toISOString() > "2026-06-02T21:00:00.000Z");
    expect(after19).toHaveLength(0);
  });

  it("domingo no genera slots", () => {
    const slots = findFreeSlots({
      from: new Date("2026-06-07T00:00:00Z"), // domingo
      to: new Date("2026-06-07T23:59:00Z"),
      durationMinutes: 60,
      appointments: [],
      timeBlocks: [],
    });
    expect(slots).toHaveLength(0);
  });
});
