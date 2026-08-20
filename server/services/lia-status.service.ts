// Play/pause global de Lia.
//
// El interruptor NO vive en la base de la clínica: es la columna `isActive` de
// la tabla `Agent` de la plataforma Hubility (Supabase). El agente la lee en
// cada mensaje entrante con una microcaché de 5 s, así que pausar surte efecto
// en unos segundos, sin redespliegue.
//
// Aquí solo hablamos con el endpoint REST de la plataforma. El secreto se queda
// en el servidor: este módulo nunca debe importarse desde un componente cliente.

const PLATFORM_URL = process.env.HUBILITY_PLATFORM_URL;
const AGENT_ID = process.env.HUBILITY_AGENT_ID;
const SECRET = process.env.HUBILITY_AGENT_STATUS_SECRET;

export class LiaStatusError extends Error {}

function config() {
  if (!PLATFORM_URL || !AGENT_ID || !SECRET) {
    throw new LiaStatusError(
      "Controle de Lia não configurado: defina HUBILITY_PLATFORM_URL, HUBILITY_AGENT_ID e HUBILITY_AGENT_STATUS_SECRET.",
    );
  }
  return { url: `${PLATFORM_URL.replace(/\/$/, "")}/api/agent-status`, agentId: AGENT_ID, secret: SECRET };
}

async function call(path: string, init?: RequestInit): Promise<boolean> {
  const { secret } = config();

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { ...init?.headers, "x-agent-status-secret": secret },
      cache: "no-store",
    });
  } catch {
    throw new LiaStatusError("Não foi possível falar com a plataforma.");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new LiaStatusError(payload?.error ?? `A plataforma respondeu ${response.status}.`);
  }
  if (typeof payload?.isActive !== "boolean") {
    throw new LiaStatusError("Resposta inesperada da plataforma.");
  }

  return payload.isActive;
}

/** `true` = Lia atendendo; `false` = pausada (descarta as mensagens em silêncio). */
export async function getLiaStatus(): Promise<boolean> {
  const { url, agentId } = config();
  return call(`${url}?agentId=${encodeURIComponent(agentId)}`);
}

export async function setLiaStatus(isActive: boolean): Promise<boolean> {
  const { url, agentId } = config();
  return call(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, isActive }),
  });
}
