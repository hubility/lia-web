import { createElement } from "react";
import { QuoteDocument } from "@/lib/pdf/quote-document";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { getClinicProfile } from "@/lib/clinic/profile";
import { requirePermission } from "@/lib/auth/guards";
import { getQuote } from "@/lib/modules/quotes/service";

export async function GET(_request: Request, ctx: RouteContext<"/api/pdf/orcamentos/[id]">) {
  await requirePermission("quotes", "read");
  const { id } = await ctx.params;
  const quote = await getQuote(id);
  const clinic = await getClinicProfile();
  const buffer = await renderPdfToBuffer(createElement(QuoteDocument, { clinic, quote }));

  return new Response(buffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="orcamento-${quote.number}.pdf"`,
    },
  });
}
