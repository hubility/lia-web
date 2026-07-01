import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { Document, Page, View } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import * as Icons from "@/lib/pdf/icons";

describe("pdf icons", () => {
  it("renderiza todos los iconos sin error (paths SVG válidos)", async () => {
    const all = Object.values(Icons).map((Icon, i) => h(Icon as any, { key: i, size: 14 }));
    const doc = h(Document, null, h(Page, { size: "A4" }, h(View, null, ...all)));
    const buf = await renderPdfToBuffer(doc);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("exporta los 10 iconos esperados", () => {
    for (const name of [
      "IconUser", "IconPhone", "IconIdCard", "IconFolder", "IconCalendar",
      "IconCreditCard", "IconChat", "IconPin", "IconGlobe", "IconTooth",
    ]) {
      expect(typeof (Icons as any)[name]).toBe("function");
    }
  });
});
