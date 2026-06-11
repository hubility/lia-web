# Mini-spec — Odontograma: continuación (catálogo por tipo + tratamentos gerais + selector de orçamento)

- **Fecha:** 2026-06-10
- **Rama:** `feature/pacientes-fase1` (worktree `.worktrees/pacientes-fase1`)
- **Estado:** punto de retoma para sesión nueva con contexto limpio
- **Spec base:** `2026-06-08-odontograma-plano-tratamento-design.md` (leerla primero)

## Contexto en una frase

El odontograma + plano de tratamento ya está **funcional** (pestaña "Odontograma" de la
ficha del paciente). Quedan tres piezas para cubrir un caso real de clínica: tratamientos
**no específicos de un diente** (limpeza, RX, clareamento) y **elegir** qué tratamientos
entran en cada orçamento.

## YA HECHO (no rehacer)

- **Visual cerrado y aprobado** por el usuario: odontograma `react-odontogram`
  (`layout="circle"`, notación FDI), 2 columnas (`grid-cols-[360px_minmax(0,1fr)]`,
  `max-w-5xl`), **sin tarjetas** (estructura por hairlines, sobre el fondo), alto del SVG
  acotado (`max-height: 340px !important` en `globals.css`, porque la librería fija
  `width:100%` inline), tooltip nativo `<title>` eliminado vía `MutationObserver` y tooltip
  estilizado propio en PT-BR. Colores: realizado = `--success`, planejado = `--info`,
  seleccionado = `--primary`. Anti-gigantismo estricto.
- **Datos:** modelo `ToothTreatment` migrado a Neon (migración `20260609000249_tooth_treatment`).
  Enum `ToothTreatmentStatus { planned, done }`. Campos: `toothFdi` (HOY obligatorio),
  `catalogItemId?`, `description` + `priceCents` (snapshot), `status`, `quoteId?`,
  `completedAt?`, `patientId`. Relaciones inversas en Patient / CatalogItem / Quote.
- **Helpers puros** (`lib/patients/odontogram.ts`): `deriveToothActivity` (realizado gana a
  planejado) y `buildQuoteLines` (planejados → líneas "Dente NN — descrição"). Tests verdes
  en `tests/odontogram.test.ts`.
- **Servicio** (`lib/modules/tooth-treatments/service.ts`): `listToothTreatments`,
  `addToothTreatment` (snapshot del catálogo), `markToothTreatmentDone`, `removeToothTreatment`,
  `generateQuoteFromPlanned` (reusa `createQuote`, enlaza `quoteId`).
- **Server actions** (`app/(dashboard)/pacientes/[id]/actions.ts`): add / markDone / remove /
  generateQuote, con `requirePermission("patients","update")` + `revalidatePath`.
- **Query + página:** `getPatientDetail` incluye `toothTreatments`;
  `pacientes/[id]/page.tsx` carga `listCatalogItems(false)` y pasa `catalog` a `PatientDetail`.
- **UI real** (sin MOCK): `components/patients/odontogram/` → `odontogram-tab.tsx`,
  `odontogram-chart.tsx`, `tooth-panel.tsx`. Picker del catálogo inline, marcar realizado (✓),
  remover (×), "Gerar orçamento · N". Traducción de tipos de diente en `lib/patients/tooth.ts`.
- Verificación al cerrar la sesión: `npx tsc --noEmit` = 0 errores; `npx vitest run` = 29/29.

## INCIDENCIA CONOCIDA (no es un bug del código)

Al pulsar "Gerar orçamento" salió `PrismaClientKnownRequestError` en `prisma.session.findUnique`
(auth). Causa: se regeneró el cliente Prisma con `migrate dev` **con el dev server corriendo**
→ cliente stale (el overlay marcaba "Next.js 16.2.6 (stale)"). **Fix: reiniciar `pnpm dev`.**
Confirmar que se va tras reiniciar antes de dar por bueno el flujo.

## PENDIENTE — lo que hay que construir

Decisión de modelado tomada con el usuario: **el tipo de tratamiento lo declara el catálogo**,
no el usuario al vuelo. Pendiente de su "go" final: usar **solo dos tipos** (diente / geral),
sin categorías más ricas (preventivo/restaurador/etc. = fuera de alcance por ahora).

### 1. Catálogo por tipo (`scope`)
- Prisma: enum `CatalogItemScope { tooth, general }` + campo `scope` en `CatalogItem`
  (`@default(tooth)`). Migración.
- **CRUD del catálogo** (pantalla Catálogo + su service/form): añadir el selector de `scope`
  al crear/editar. (Esto SÍ toca esa pantalla — única salida del alcance "solo odontograma".)
- Seed: clasificar items existentes (default `tooth`; marcar a mano limpeza/RX/consulta como
  `general`).

### 2. `toothFdi` opcional + sección "Geral" en la UI
- Prisma: `toothFdi` pasa a `String?` (null = tratamento geral). Migración (puede ir junta con la 1).
- UI (columna derecha del odontograma): una sección fija **"Geral"** encima del panel del
  diente, con su propio "+ Tratamento" que lista **solo** items `scope = general` y crea
  treatments con `toothFdi = null`. El panel del diente sigue igual pero su picker filtra
  **solo** items `scope = tooth`.
- En el odontograma NO se pinta nada para los gerais (no tienen pieza).
- `buildQuoteLines`: si `toothFdi` es null → descripción `"Geral — {description}"` en vez de
  `"Dente NN — …"`. Actualizar el test.

### 3. Selector de tratamientos al generar orçamento (el Dr. elige)
- Hoy `generateQuoteFromPlanned` mete **todos** los planejados pendientes automáticamente. El
  usuario fue tajante: el Dr. **tiene que elegir**.
- UX acordada: al pulsar "Gerar orçamento" se abre un **Sheet** lateral (patrón de la app:
  ver `components/patients/patient-sheet.tsx` / `components/ui/sheet.tsx`) con la lista de
  **todos los planejados pendientes de todas las piezas + gerais juntos**, cada uno con
  **casilla** (todas marcadas por defecto), **total** abajo que se recalcula, y botón
  "Gerar orçamento (R$ total)". Confirma → crea el orçamento solo con los marcados → cierra →
  aparece en la pestaña Orçamentos. Los no marcados siguen disponibles.
- Servicio: sustituir `generateQuoteFromPlanned(patientId)` por
  `generateQuoteFromSelected(patientId, treatmentIds: string[])` (filtrar en el `where` por
  `id IN ids AND patientId AND status=planned AND quoteId=null` por seguridad). Action y UI
  acordes.
- Fuera de alcance del Sheet (como en el spec base): descuento, forma de pago, validez. Se
  editan luego en Orçamentos.

## Orden sugerido

1. Reiniciar dev server, confirmar que el flujo actual funciona.
2. Migración: `scope` en CatalogItem + `toothFdi` opcional.
3. CRUD catálogo con `scope` + reclasificar seed.
4. Sección "Geral" + filtrado de pickers por `scope`.
5. `buildQuoteLines` para null + test.
6. Selector de orçamento (servicio `generateQuoteFromSelected` + action + Sheet).
7. Verificar: `npx tsc --noEmit`, `npx vitest run`, y el flujo en navegador.

## Archivos clave

- Odontograma UI: `components/patients/odontogram/{odontogram-tab,odontogram-chart,tooth-panel}.tsx`
- Helpers/tests: `lib/patients/odontogram.ts`, `lib/patients/tooth.ts`, `tests/odontogram.test.ts`
- Servicio: `lib/modules/tooth-treatments/service.ts`; quotes: `lib/modules/quotes/service.ts`
- Actions/página: `app/(dashboard)/pacientes/[id]/{actions,page}.tsx`
- Catálogo: `lib/modules/catalog/service.ts` + pantalla `app/(dashboard)/catalogo/`
- Schema: `prisma/schema.prisma`; estilos del widget: `app/globals.css` (bloque `.Odontogram`)
- Design system: `PRODUCT.md`, `DESIGN.md` (raíz del worktree)

## Recordatorios de estilo (críticos)

- **Comunicación: español de España** (peninsular, tú-forma). NUNCA voseo. El usuario se ha
  molestado varias veces.
- **Anti-gigantismo**: compacto y denso. Jerarquía por peso, no por tamaño.
- **Nativo, no pegado**: calcar tokens y patrones de la agenda. Hairlines, no cajas. Rojo =
  señal escasa.
