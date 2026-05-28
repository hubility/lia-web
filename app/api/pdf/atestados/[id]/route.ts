import { createElement } from "react";
import { getClinicProfile } from "@/lib/clinic/profile";
import { requirePermission } from "@/lib/auth/guards";
import { CertificateDocument } from "@/lib/pdf/certificate-document";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { getCertificate } from "@/lib/modules/certificates/service";

export async function GET(_request: Request, ctx: RouteContext<"/api/pdf/atestados/[id]">) {
  await requirePermission("certificates", "read");
  const { id } = await ctx.params;
  const certificate = await getCertificate(id);
  const clinic = await getClinicProfile();
  const buffer = await renderPdfToBuffer(createElement(CertificateDocument, { clinic, certificate }));

  return new Response(buffer, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="atestado-${certificate.id}.pdf"`,
    },
  });
}
