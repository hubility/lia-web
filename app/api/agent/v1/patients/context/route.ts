import { z } from "zod";
import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, jsonError, withApiErrors } from "@/lib/http";
import { getPatientContextByPhone } from "@/lib/modules/patients/service";

// Contexto del paciente por teléfono: próximas consultas, último orçamento,
// última receita, atestados vigentes. Si el teléfono no es paciente, responde
// { isPatient: false } con 200 (el agente necesita saberlo, no es un error).
export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const phone = new URL(request.url).searchParams.get("phone");
    const parsed = z.string().min(1).safeParse(phone);
    if (!parsed.success) return jsonError(422, "Parâmetro 'phone' é obrigatório.");

    return jsonOk(await getPatientContextByPhone(parsed.data));
  });
}
