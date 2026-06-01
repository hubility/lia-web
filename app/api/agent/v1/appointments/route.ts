import { z } from "zod";
import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, jsonError, withApiErrors } from "@/lib/http";
import { createAppointment, listUpcomingAppointments } from "@/lib/modules/appointments/service";
import { assertBookable } from "@/lib/modules/appointments/booking";
import { findPatientByPhone } from "@/lib/modules/patients/service";
import { getCatalogItem } from "@/lib/modules/catalog/service";

// El agente solo conoce el teléfono; aquí se resuelve a paciente internamente.

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    if (!phone) return jsonError(422, "Parâmetro 'phone' é obrigatório.");

    const patient = await findPatientByPhone(phone);
    if (!patient) return jsonOk([]); // no es paciente → sin citas

    // Solo próximas: futuras y no canceladas.
    return jsonOk(await listUpcomingAppointments(patient.id));
  });
}

const createSchema = z.object({
  phone: z.string().min(1),
  catalogItemId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  startsAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(422, "Dados inválidos para criar consulta.");
    const body = parsed.data;

    const patient = await findPatientByPhone(body.phone);
    if (!patient) {
      return jsonError(404, "Paciente não encontrado. Cadastre o paciente antes de agendar.");
    }

    // Duración: explícita o derivada del servicio.
    let durationMinutes = body.durationMinutes;
    let title = body.title;
    if (body.catalogItemId) {
      const item = await getCatalogItem(body.catalogItemId);
      if (!item) return jsonError(404, "Serviço não encontrado.");
      durationMinutes ??= item.durationMinutes;
      title ??= item.name;
    }
    if (!durationMinutes) {
      return jsonError(422, "Informe durationMinutes ou catalogItemId.");
    }

    const startsAt = new Date(body.startsAt);
    await assertBookable({ startsAt, durationMinutes });

    const appointment = await createAppointment({
      patientId: patient.id,
      catalogItemId: body.catalogItemId ?? null,
      title: title ?? "Consulta",
      startsAt,
      durationMinutes,
      status: "scheduled",
      notes: body.notes ?? null,
    });

    return jsonOk(appointment, { status: 201 });
  });
}
