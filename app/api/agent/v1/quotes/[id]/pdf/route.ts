import { createElement } from "react";
import { requireApiKey } from "@/lib/auth/api-keys";
import { withApiErrors } from "@/lib/http";
import { getClinicProfile } from "@/lib/clinic/profile";
import { QuoteDocument } from "@/lib/pdf/quote-document";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { getQuote } from "@/lib/modules/quotes/service";

// PDF del orçamento para el agente (x-api-key). La ruta de navegador
// (/api/pdf/orcamentos/[id]) usa requirePermission y no admite api key.

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const { id } = await ctx.params;
    const quote = await getQuote(id);
    const clinic = await getClinicProfile();
    const buffer = await renderPdfToBuffer(createElement(QuoteDocument, { clinic, quote }));

    return new Response(buffer, {
      headers: { "content-type": "application/pdf" },
    });
  });
}
