import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, withApiErrors } from "@/lib/http";
import { createPatient, listPatients } from "@/lib/modules/patients/service";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const url = new URL(request.url);
    return jsonOk(await listPatients(url.searchParams.get("q")));
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const body = await request.json();
    return jsonOk(await createPatient(body), { status: 201 });
  });
}
