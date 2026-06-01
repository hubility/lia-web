import { z } from "zod";
import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, jsonError, withApiErrors } from "@/lib/http";
import {
  getAppointment,
  moveAppointment,
  setAppointmentStatus,
} from "@/lib/modules/appointments/service";
import { assertBookable } from "@/lib/modules/appointments/booking";

// El [id] es el appointmentId (que el agente obtuvo al listar/consultar contexto),
// no un identificador de paciente.

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  startsAt: z.string().datetime({ offset: true }).optional(),
  durationMinutes: z.number().int().positive().optional(),
});

// Reprogramar.
export async function PATCH(request: Request, ctx: Ctx) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const { id } = await ctx.params;

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(422, "Dados inválidos para reagendar.");

    const current = await getAppointment(id);
    if (!current) return jsonError(404, "Consulta não encontrada.");

    const startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : current.startsAt;
    const durationMinutes = parsed.data.durationMinutes ?? current.durationMinutes;

    await assertBookable({ startsAt, durationMinutes }, id);
    return jsonOk(await moveAppointment(id, startsAt, durationMinutes));
  });
}

// Cancelar (no borrado físico).
export async function DELETE(request: Request, ctx: Ctx) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const { id } = await ctx.params;

    const current = await getAppointment(id);
    if (!current) return jsonError(404, "Consulta não encontrada.");

    return jsonOk(await setAppointmentStatus(id, "cancelled"));
  });
}
