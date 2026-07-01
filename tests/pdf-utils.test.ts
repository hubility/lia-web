import { describe, expect, it } from "vitest";
import { calcAge } from "@/lib/pdf/utils";

describe("calcAge", () => {
  const ref = new Date("2026-07-01T00:00:00Z");

  it("devuelve null sin fecha de nacimiento", () => {
    expect(calcAge(null, ref)).toBeNull();
    expect(calcAge(undefined, ref)).toBeNull();
  });

  it("calcula la edad ya cumplida", () => {
    expect(calcAge(new Date("1990-01-10T00:00:00Z"), ref)).toBe(36);
  });

  it("resta un año si el cumpleaños aún no llegó", () => {
    expect(calcAge(new Date("1990-12-31T00:00:00Z"), ref)).toBe(35);
  });
});
