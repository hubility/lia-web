# Session: Documentación de la API del agente con Scalar
Date: 2026-05-31 23:31
Project: lia-web (.worktrees/lia-web-platform)

## Goal
Documentar la API REST del agente (`/api/agent/v1/*`) con un documento OpenAPI 3.1
estático servido a través de Scalar, visible solo en desarrollo.

## Decisions
- **Renderizador Scalar, no Swagger UI.** Mejor UX y "try it out", encaja con el cuidado
  de marca. Paquete: `@scalar/nextjs-api-reference` (soporta Next 16 oficialmente desde
  que relajaron su peerDependency; su handler `GET` es síncrono).
- **Spec estático a mano (YAML), NO derivado de Zod.** Decisión del usuario: cero
  acoplamiento al runtime, portable a Postman/Insomnia. Para ~8 rutas estables es
  manejable. Se descartó `z.toJSONSchema()` pese a usar Zod 4.
- **Doc solo en desarrollo.** `isDocsEnabled()` = `NODE_ENV !== "production"`. Esto deja la
  doc fuera también de los previews de Vercel (son `production`). El guard se aplica en los
  dos route handlers (`/openapi` y `/docs`).
- **Campos de los schemas leídos del código real, no inventados.** El usuario advirtió
  explícitamente contra inventar/sobre-ingeniería. `Patient`, `Appointment`, `CatalogItem`,
  `Quote`, `Prescription`, `MedicalCertificate` y `PatientContext` (forma `oneOf`:
  `isPatient:false` | contexto completo) se extrajeron de `prisma/schema.prisma` y de los
  servicios. `catalogItem` anidado solo donde los servicios hacen `include`.
- **Se abandonó el design doc formal de brainstorming.** El usuario lo cortó: "para crear
  un endpoint y un fichero no hace falta tanta parafernalia". Se fue directo a implementar.

## Work Done
- `docs/api/openapi.yaml` (NUEVO): OpenAPI 3.1 con auth global `x-api-key`, 8 operaciones,
  envelopes `{data}`/`{error}`, códigos reales (401/404/409/422) y ejemplos.
- `lib/docs.ts` (NUEVO): `isDocsEnabled()`.
- `app/api/agent/v1/openapi/route.ts` (NUEVO): sirve el YAML con `readFile` +
  `Content-Type: application/yaml`. Corre en Node (acceso a filesystem).
- `app/api/agent/v1/docs/route.ts` (NUEVO): página de Scalar (`ApiReference({url})`)
  envuelta en un `GET` propio con el guard de dev.
- Verificación e2e: `tsc --noEmit` exit 0; `/openapi` → 200 application/yaml; `/docs` → 200
  text/html, contra localhost:3000.

## Learnings
- **El handler de `ApiReference(config)` no recibe argumentos** (tipo `() => Response`):
  genera el HTML solo desde la config. Pasarle `request` da TS2554 "Expected 0 arguments".
  Se llama `reference()` sin args.
- **El 401 de Scalar venía de la API key en la query string.** Al probar `GET /patients`,
  la key viajaba como `?...&x-api-key=...` (la API solo la lee del header → 401, y la key
  quedó en texto plano en los logs). Solución: meterla en el panel Authentication de Scalar
  / pestaña Headers de Postman, NUNCA en Params.
- **AGENTS.md exige leer `node_modules/next/dist/docs/` antes de escribir handlers.** En
  Next 16 la firma sigue siendo `export async function GET(request: Request)` y `params` es
  `Promise` (no afecta a rutas no dinámicas).

## Key Files
.worktrees/lia-web-platform/docs/api/openapi.yaml
.worktrees/lia-web-platform/lib/docs.ts
.worktrees/lia-web-platform/app/api/agent/v1/openapi/route.ts
.worktrees/lia-web-platform/app/api/agent/v1/docs/route.ts
