import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, withApiErrors } from "@/lib/http";
import { createAppointment, listAppointments } from "@/lib/modules/appointments/service";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    return jsonOk(await listAppointments());
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const body = await request.json();
    return jsonOk(await createAppointment({ ...body, startsAt: new Date(body.startsAt) }), { status: 201 });
  });
}
