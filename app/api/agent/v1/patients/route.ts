import { z } from "zod";
import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, jsonError, withApiErrors } from "@/lib/http";
import {
  createPatient,
  findPatientByPhone,
  listPatients,
} from "@/lib/modules/patients/service";

// GET ?phone= → match exacto (el agente solo conoce el teléfono).
// GET ?q=     → búsqueda difusa (compatibilidad con la web).
export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    if (phone) {
      const patient = await findPatientByPhone(phone);
      return jsonOk(patient ? [patient] : []);
    }
    return jsonOk(await listPatients(url.searchParams.get("q")));
  });
}

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().nullable(),
  cpf: z.string().optional().nullable(),
  birthDate: z.string().datetime({ offset: true }).optional().nullable(),
  recordNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError(422, "Dados inválidos: nome e telefone são obrigatórios.");
    const { birthDate, ...rest } = parsed.data;
    return jsonOk(
      await createPatient({ ...rest, birthDate: birthDate ? new Date(birthDate) : null }),
      { status: 201 }
    );
  });
}
