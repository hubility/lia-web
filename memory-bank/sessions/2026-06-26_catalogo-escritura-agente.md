# Session: Catálogo editable por Lia — diseño del endpoint de escritura (sin implementar)
Date: 2026-06-26 18:00
Project: lia-web

## Goal
Dar a Lia (el agente por WhatsApp) la capacidad de **crear / editar / desactivar
procedimientos del catálogo** cuando la admin se lo pide por conversación, porque ya lo hace
de forma natural ("pode me passar que eu ajusto") y hoy no tiene efecto: la API del agente solo
expone `GET /catalog`.

## Estado final
**No se escribió código.** La sesión fue larga y conflictiva; convergió en un diseño mínimo pero
el usuario nunca dio el visto bueno para implementar. Quedan **dos decisiones abiertas** (abajo).
El árbol del repo está limpio — ningún archivo modificado.

## Decisión final (el diseño que SÍ aplica)
Un solo cambio: añadir un **`POST` a `app/api/agent/v1/catalog/route.ts`**, sobrio como
`POST /quotes` — `requireApiKey` → `body` → servicio → respuesta. Patrón `createOrUpdate`:
- con `id` en el body → `updateCatalogItem`; sin `id` → `createCatalogItem`.
- **Solo `requireApiKey`**, igual que TODOS los demás writes del agente. Sin auth de admin por
  teléfono, sin migración, sin spec, sin tocar el dashboard ni el servicio.

Esbozo acordado (pendiente de cerrar los 2 detalles):
```ts
export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const body = await request.json();
    const { id, ...data } = body;
    return jsonOk(id ? await updateCatalogItem(id, data) : await createCatalogItem(data),
      { status: id ? 200 : 201 });
  });
}
```

## Decisiones abiertas (resolver antes de escribir)
1. **Unidad de precio:** ¿el agente manda `priceCents` (140000) o `priceReais` (1400, ×100 en el
   endpoint)? Reais es más natural para un LLM. Los precios dentales son reais **enteros**
   (300/500/1400), sin centavos.
2. **Update parcial vs completo:** `updateCatalogItem` actual exige el objeto completo
   (`name`+`priceCents`+`durationMinutes`); si Lia manda un solo campo, falla. Decidir si Lia
   siempre manda todo, o se añade un `patchCatalogItem(id, partial)` tolerante a parciales.

## Learnings (lo más importante de esta sesión)
- **El modelo de seguridad real del sistema: la API key ES la confianza total.** Los 15 endpoints
  leídos lo confirman: TODOS los writes del agente (`appointments`, `patients`, `quotes`,
  `prescriptions`, `certificates`) usan **solo `requireApiKey`**. El teléfono **nunca autoriza** —
  solo resuelve *de qué paciente* se trata (`findPatientByPhone`, match exacto). "Quién está del
  otro lado" es problema del **agente** (`agente-LIA`), no de `lia-web`.
- **El mundo sesión/`User`/`role` y el mundo `ApiKey` están separados sin puente.** `User` no tiene
  teléfono; `ApiKey` no tiene rol/scope. Las escrituras admin del dashboard van por **Server
  Actions** con `requirePermission` (sesión cookie). Las descargas de PDF (`/api/pdf/*`) también
  usan sesión, no API key.
- **Toda mi "autorización de admin" fue sobre-ingeniería que costó horas:** allowlist por env var,
  `Patient.isAdmin`, `User.phone` como puente, scope en `ApiKey`. Peor: el chequeo por teléfono era
  **seguridad falsa** — el número de la admin es público y el `requesterPhone` lo manda el propio
  cliente, así que con la API key + un número público se saltaría. No añade nada sobre la key.
- **El spec fundacional (`2026-05-27-lia-web-platform-design.md`, líneas 77/176/551) excluye el
  catálogo de la API key a propósito** (mismo tier admin que Usuarios). "Hacerlo igual que los
  otros writes" supera conscientemente esa línea — es una decisión, no un descuido.
- **Cosas que YA existían y propuse por error:** `CatalogItem.description` (textarea en el sheet +
  devuelto a Lia); `priceCents === 0` → renderiza **"sob consulta"** (`catalog-list.tsx:102,126`).
  Para "info complementaria + precio variable" la herramienta de datos/UI ya está completa.
- **Proceso (crítico):** NO tocar código sin permiso explícito. El usuario rechazó varios intentos
  de `Write`/`Edit` y se molestó mucho; pidió ver el código exacto ANTES de aprobar. Regla para la
  próxima sesión: mostrar el diff literal y esperar un "escríbelo" explícito.

## Lado del agente (fase 2, otro repo `agente-LIA`)
Fuera de `lia-web`: registrar el tool de catálogo y que el agente solo lo use en conversaciones con
la admin. La frontera real de seguridad sigue siendo server-side, pero aquí no hay nada que hacer.

## Key Files
app/api/agent/v1/catalog/route.ts
lib/modules/catalog/service.ts
app/api/agent/v1/quotes/route.ts
docs/api/openapi.yaml
docs/superpowers/specs/2026-05-27-lia-web-platform-design.md
