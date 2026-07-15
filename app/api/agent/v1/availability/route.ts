import { z } from "zod";
import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, jsonError, withApiErrors } from "@/lib/http";
import { findFreeSlots } from "@/lib/agenda/availability";
import { listAppointments } from "@/lib/modules/appointments/service";
import { listTimeBlocks } from "@/lib/modules/timeblocks/service";
import { getCatalogItem } from "@/lib/modules/catalog/service";
import { getClinicSchedule } from "@/lib/clinic/schedule";

const querySchema = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  catalogItemId: z.string().min(1),
});

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
      catalogItemId: url.searchParams.get("catalogItemId"),
    });
    if (!parsed.success) {
      return jsonError(422, "Parâmetros inválidos: from, to (ISO) e catalogItemId são obrigatórios.");
    }

    const from = new Date(parsed.data.from);
    const to = new Date(parsed.data.to);

    const item = await getCatalogItem(parsed.data.catalogItemId);
    if (!item) return jsonError(404, "Serviço não encontrado.");

    const [appointments, timeBlocks, schedule] = await Promise.all([
      listAppointments(from, to),
      listTimeBlocks(from, to),
      getClinicSchedule(),
    ]);

    const slots = findFreeSlots({
      from,
      to,
      durationMinutes: item.durationMinutes,
      appointments,
      timeBlocks,
      schedule,
    });

    return jsonOk({
      durationMinutes: item.durationMinutes,
      slots: slots.map((s) => s.toISOString()),
    });
  });
}
