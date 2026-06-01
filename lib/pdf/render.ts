import type { ReactElement } from "react";
import { pdf } from "@react-pdf/renderer";

export async function renderPdfToBuffer(document: ReactElement) {
  const blob = await pdf(document as Parameters<typeof pdf>[0]).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
