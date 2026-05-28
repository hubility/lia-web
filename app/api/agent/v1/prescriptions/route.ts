import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, withApiErrors } from "@/lib/http";
import { createPrescription, listPrescriptions } from "@/lib/modules/prescriptions/service";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    return jsonOk(await listPrescriptions());
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const body = await request.json();
    return jsonOk(await createPrescription({ ...body, issueDate: new Date(body.issueDate) }), { status: 201 });
  });
}
