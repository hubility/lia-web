import { describe, it, expect } from "vitest";
import { parseAgendaDate, startOfWeek, endOfWeek, startOfDay, endOfDay, rangeFor, isSameDay } from "../lib/agenda/range";
import { parseDateTime, parseDate } from "../lib/dates";

// Estos tests corren con TZ=UTC (config de Vitest) para simular Vercel.
describe("agenda TZ-safety (proceso en UTC)", () => {
  it("parseDateTime: 14:30 Fortaleza -> 17:30Z", () => {
    expect(parseDateTime("2026-06-02T14:30").toISOString()).toBe("2026-06-02T17:30:00.000Z");
  });
  it("parseDate: fecha pura -> medianoche Fortaleza (03:00Z)", () => {
    expect(parseDate("1990-05-02").toISOString()).toBe("1990-05-02T03:00:00.000Z");
  });
  it("parseAgendaDate: '2026-06-02' -> medianoche Fortaleza", () => {
    expect(parseAgendaDate("2026-06-02").toISOString()).toBe("2026-06-02T03:00:00.000Z");
  });
  it("startOfWeek de un martes -> lunes 00:00 Fortaleza", () => {
    const ws = startOfWeek(parseAgendaDate("2026-06-02")); // 2 jun = martes
    expect(ws.toISOString()).toBe("2026-06-01T03:00:00.000Z"); // lunes 1 jun 00:00 -03
  });
  it("rangeFor week: lunes 00:00 .. sábado 23:59:59.999 Fortaleza", () => {
    const { from, to } = rangeFor("week", parseAgendaDate("2026-06-02"));
    expect(from.toISOString()).toBe("2026-06-01T03:00:00.000Z");
    expect(to.toISOString()).toBe("2026-06-07T02:59:59.999Z"); // sáb 6 jun 23:59:59.999 -03 = dom 7 02:59Z
  });
  it("isSameDay cruza el borde UTC correctamente", () => {
    // Instante = sáb 6 jun 23:00 Fortaleza = dom 7 jun 02:00Z. En UTC parece domingo.
    const lateSat = new Date("2026-06-07T02:00:00Z");
    expect(isSameDay(lateSat, parseAgendaDate("2026-06-06"))).toBe(true);
    expect(isSameDay(lateSat, parseAgendaDate("2026-06-07"))).toBe(false);
  });
});
