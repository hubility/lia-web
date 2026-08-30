import { createElement } from "react";
import { requireApiKey } from "@/lib/auth/api-keys";
import { withApiErrors } from "@/lib/http";
import { getClinicProfile } from "@/lib/clinic/profile";
import { CertificateDocument } from "@/lib/pdf/certificate-document";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { getCertificate } from "@/lib/modules/certificates/service";

// PDF del atestado para el agente (x-api-key). La ruta de navegador
// (/api/pdf/atestados/[id]) usa requirePermission y no admite api key.

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const { id } = await ctx.params;
    const certificate = await getCertificate(id);
    const clinic = await getClinicProfile();
    const buffer = await renderPdfToBuffer(createElement(CertificateDocument, { clinic, certificate }));

    return new Response(buffer, {
      headers: { "content-type": "application/pdf" },
    });
  });
}
