import { createElement } from "react";
import { getClinicProfile } from "@/lib/clinic/profile";
import { requirePermission } from "@/lib/auth/guards";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { getPrescription } from "@/lib/modules/prescriptions/service";

export async function GET(_request: Request, ctx: RouteContext<"/api/pdf/receitas/[id]">) {
  await requirePermission("prescriptions", "read");
  const { id } = await ctx.params;
  const prescription = await getPrescription(id);
  const clinic = await getClinicProfile();
  const buffer = await renderPdfToBuffer(createElement(PrescriptionDocument, { clinic, prescription }));

  return new Response(buffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="receita-${prescription.id}.pdf"`,
    },
  });
}
