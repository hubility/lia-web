import { describe, expect, it } from "vitest";
import { Document, Page, Text } from "@react-pdf/renderer";
import { createElement as h } from "react";
import "@/lib/pdf/fonts";
import { brand } from "@/lib/pdf/brand";
import { renderPdfToBuffer } from "@/lib/pdf/render";

describe("pdf base", () => {
  it("expone tokens de marca", () => {
    expect(brand.red).toBe("#D32F2F");
    expect(brand.font).toBe("Outfit");
  });

  it("renderiza un PDF usando la fuente Outfit registrada", async () => {
    const doc = h(
      Document,
      null,
      h(Page, { size: "A4" }, h(Text, { style: { fontFamily: brand.font, fontWeight: 700 } }, "Olá"))
    );
    const buf = await renderPdfToBuffer(doc);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });
});
