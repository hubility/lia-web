import { createElement } from "react";
import { requireApiKey } from "@/lib/auth/api-keys";
import { withApiErrors } from "@/lib/http";
import { getClinicProfile } from "@/lib/clinic/profile";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { getPrescription } from "@/lib/modules/prescriptions/service";

// PDF de la receita para el agente (x-api-key). La ruta de navegador
// (/api/pdf/receitas/[id]) usa requirePermission y no admite api key.

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const { id } = await ctx.params;
    const prescription = await getPrescription(id);
    const clinic = await getClinicProfile();
    const buffer = await renderPdfToBuffer(createElement(PrescriptionDocument, { clinic, prescription }));

    return new Response(buffer, {
      headers: { "content-type": "application/pdf" },
    });
  });
}
