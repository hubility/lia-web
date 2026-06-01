# Session: Motor de disponibilidad + API del agente (por teléfono)
Date: 2026-05-31
Project: lia-web (.worktrees/lia-web-platform)

## Goal
Implementar el "motor de consultas" (cálculo de huecos libres) y endurecer/completar
la API REST que consume el agente de IA, partiendo de validar una propuesta de ChatGPT
que resultó correcta en algoritmo pero desalineada con el repo (motor en HTML obsoleto,
parser de frases en JS innecesario, y duplicaba código ya existente).

## Decisions
- **Motor = función pura que invierte `findCollision`.** `findFreeSlots` reutiliza la
  lógica de solape existente en vez de reimplementarla. `overlaps` es privado en
  collision.ts → se reusa vía `findCollision` (devuelve null si el candidato está libre),
  sin tocar su visibilidad.
- **El agente envía la ventana (from–to); el motor no la calcula.** La traducción de
  lenguaje natural ("mañana por la mañana") es trabajo del LLM, no de nuestro código.
- **Paso entre candidatos = duración del servicio** (limpieza 60min → cada 60; avaliação
  30min → cada 30). Decisión del usuario tras pedir referencias de apps similares.
- **Timezone: `Intl` nativo con `America/Fortaleza`, NO offset −3 hardcoded.** El usuario
  detectó que hardcodear −3 era el mismo error que se criticó de ChatGPT. El proceso corre
  en servidores de EEUU, así que NUNCA se depende de la hora local del proceso. Aislado en
  `lib/clinic-tz.ts` para migrar a `Temporal` el día que esté estable.
- **Identificador del paciente = SOLO el teléfono.** Regla transversal: ningún endpoint del
  agente acepta/devuelve `patientId`. La API traduce teléfono→paciente internamente vía
  `findPatientByPhone` (match EXACTO, no el `contains` difuso de la web). Una cita sí se
  identifica por `appointmentId` (que el agente obtiene al listar/consultar contexto) —
  eso no identifica a un usuario, no rompe la regla.
- **Blindaje del create = validación simple** (horario Fortaleza 08–18 + colisión → 409),
  sin transacción anti-carrera por ahora. Suficiente para un consultorio de un dentista.
- **`GET /appointments?phone=` devuelve SOLO próximas** (futuras, no canceladas, asc), no
  el historial completo. Coherente con `upcomingAppointments` del contexto; la query se
  comparte vía `listUpcomingAppointments`.
- **Contexto del paciente con `{ isPatient: false }` y HTTP 200** cuando el teléfono no
  existe (no 404): el agente necesita saber "no es paciente todavía", no recibir un error.
- **Atestados "activos" se derivan del rango** `absenceStartDate <= hoy <= absenceEndDate`
  (no hay campo de estado). El corte de "hoy" se calcula en hora de Fortaleza.

## Work Done
- `lib/clinic-tz.ts` (NUEVO): `CLINIC_TZ`, `utcToWallClock`, `wallClockToUtc` con `Intl`.
- `lib/agenda/availability.ts` (NUEVO): `findFreeSlots` (motor puro).
- `lib/modules/appointments/booking.ts` (NUEVO): `assertBookable` (horario + colisión,
  `BookingError` con `status` 409/422). Extrae la lógica duplicada de las server actions.
- `lib/modules/appointments/service.ts`: `listAppointments` ahora acepta filtro `patientId`;
  añadidas `getAppointment` y `listUpcomingAppointments`.
- `lib/modules/patients/service.ts`: añadidas `findPatientByPhone` y `getPatientContextByPhone`.
- `lib/modules/catalog/service.ts`: añadida `getCatalogItem`.
- `lib/http.ts`: `withApiErrors` ahora mapea errores con `status` numérico al código HTTP.
- Endpoints: `GET /availability` (NUEVO), POST/GET `/appointments` endurecidos por teléfono,
  `/appointments/[id]` (NUEVO) PATCH reprogramar / DELETE cancelar, `/patients` con `?phone=`
  exacto + Zod en POST, `/patients/context` (NUEVO).
- `scripts/create-api-key.ts` (NUEVO): genera API key e imprime el token en claro una vez.
- Tests: `tests/clinic-tz.test.ts`, `tests/availability.test.ts` (corren con
  `TZ=America/New_York` para probar el requisito de timezone). `vitest.config.ts`: alias `@`.

## Learnings
- **`tsx` directo no carga `.env`** (a diferencia de `prisma db seed`). El script de API key
  fallaba con "Environment variable not found: DATABASE_URL" hasta añadir `import "dotenv/config"`.
- **Las API keys no se pueden recuperar**: en la BD solo vive el `keyHash` (SHA-256). Si se
  pierde el token hay que generar uno nuevo. El seed solo imprime la key la primera vez.
- **Los diagnósticos del IDE entre edits son estados intermedios** y pueden contradecirse;
  la fuente de verdad es `tsc --noEmit` tras completar todos los edits (exit 0, 15 tests OK).
- **Verificación e2e real**: catálogo y disponibilidad probados con curl.exe en PowerShell
  contra localhost:3000 con key válida. `curl` en PowerShell es alias de `Invoke-WebRequest`
  → hay que usar `curl.exe` para sintaxis estándar. El `+` del teléfono se escapa como `%2B`.
- **Riesgo abierto (fuera de alcance)**: el match de teléfono es exacto; si los teléfonos se
  guardan con formatos distintos (con/sin +55, espacios, guiones) la búsqueda falla aunque el
  paciente exista. Normalizar teléfonos queda pendiente.

## Key Files
.worktrees/lia-web-platform/lib/clinic-tz.ts
.worktrees/lia-web-platform/lib/agenda/availability.ts
.worktrees/lia-web-platform/lib/modules/appointments/booking.ts
.worktrees/lia-web-platform/lib/modules/appointments/service.ts
.worktrees/lia-web-platform/lib/modules/patients/service.ts
.worktrees/lia-web-platform/lib/modules/catalog/service.ts
.worktrees/lia-web-platform/lib/http.ts
.worktrees/lia-web-platform/app/api/agent/v1/availability/route.ts
.worktrees/lia-web-platform/app/api/agent/v1/appointments/route.ts
.worktrees/lia-web-platform/app/api/agent/v1/appointments/[id]/route.ts
.worktrees/lia-web-platform/app/api/agent/v1/patients/route.ts
.worktrees/lia-web-platform/app/api/agent/v1/patients/context/route.ts
.worktrees/lia-web-platform/scripts/create-api-key.ts
.worktrees/lia-web-platform/tests/clinic-tz.test.ts
.worktrees/lia-web-platform/tests/availability.test.ts
.worktrees/lia-web-platform/vitest.config.ts
