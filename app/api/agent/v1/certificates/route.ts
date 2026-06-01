import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, withApiErrors } from "@/lib/http";
import { createCertificate, listCertificates } from "@/lib/modules/certificates/service";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    return jsonOk(await listCertificates());
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const body = await request.json();
    return jsonOk(await createCertificate({
      ...body,
      issueDate: new Date(body.issueDate),
      absenceStartDate: new Date(body.absenceStartDate),
      absenceEndDate: new Date(body.absenceEndDate),
    }), { status: 201 });
  });
}
