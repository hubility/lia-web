# Session: Vista de pacientes Fase 1 (master-detail) + sesión muy conflictiva de estilos
Date: 2026-06-08 18:30
Project: lia-web (worktree `.worktrees/pacientes-fase1`, rama `feature/pacientes-fase1`)

## Goal
Convertir el CRUD plano de pacientes en una vista master-detail (lista buscable + ficha
con cabecera y pestañas), reutilizando el lenguaje visual de la agenda. Se siguió el flujo
brainstorming → spec → plan → implementación.

## Decisions
- **Arquitectura**: layout anidado master-detail. `pacientes/layout.tsx` carga todos los
  pacientes (server) y `PatientList` filtra en memoria (los layouts no reciben
  `searchParams`). Paciente activo vía `useSelectedLayoutSegment()`. **Pestañas = estado de
  cliente, no rutas** (una sola query `getPatientDetail`).
- **Edición/alta por `Sheet`** (un único `PatientSheet` create+edit, calcando
  `AppointmentSheet`). Para que el Sheet cierre bien, `actions.ts` se cambió a **revalidar
  sin `redirect`** (create devuelve el id y el cliente navega).
- **Valor del orçamento** como dato informativo: helper puro `quoteValueCents` (Σ líneas −
  descuento), con `getPatientDetail` ampliado con `quotes.include.lines`.
- **Full-height sin números mágicos**: `app-shell.tsx` pasó a `h-screen` + columna flex +
  `main flex-1 overflow-y-auto`; la página usa `h-full`. (Antes metí un
  `h-[calc(100vh-6.5rem)]` hardcodeado — el usuario lo rechazó con razón.)
- **Divisor vertical** entre lista y detalle: `border-r pr-6` en la lista + `pl-6` en el
  detalle, y se quitó la caja con borde de la lista para que las dos columnas sean
  consistentes (último cambio aprobado de la sesión).
- Breadcrumb: id crudo → singular del padre ("Paciente").

## Work Done
- Spec y plan commiteados en `docs/superpowers/specs/` y `docs/superpowers/plans/`.
- `lib/patients/derive.ts` (`quoteValueCents`, `calculateAge`) + tests (vitest, 5 verdes).
- `service.ts`: `getPatientDetail` con lines + `listPatientDirectory` + tipos.
- Componentes: `patient-list.tsx`, `patient-detail.tsx`, `patient-sheet.tsx`. Eliminado
  `patient-form.tsx` (huérfano).
- `actions.ts` sin redirect; `app-shell.tsx` full-height; `breadcrumb.tsx` id→singular.
- `tsc`, 26 tests y `next build` en verde tras la implementación inicial.

## Learnings
- **CAUSA RAÍZ probable del infierno de estilos (PENDIENTE de confirmar):** el worktree vive
  bajo `.worktrees/`, que está en `.gitignore` (línea 48). **Tailwind v4 autodetecta el
  contenido ignorando las rutas de `.gitignore`** → las clases NUEVAS usadas solo en
  archivos del worktree (`text-[8px]`, `text-red-500`, etc.) **no se generan en el CSS**,
  mientras que las clases ya usadas por la agenda (text-xs, font-mono…) sí funcionan. Eso
  explica que durante horas "ningún estilo nuevo se aplicara" en `patient-detail.tsx`.
  **Fix candidato (NO aplicado/commiteado):** añadir a `app/globals.css`
  `@source "../app";` y `@source "../components";` para forzar el escaneo. **Verificar al
  inicio de la próxima sesión si esto es lo correcto** (o si fue staleness del dev server /
  el cambio button→Link lo que lo destrabó).
- **Setup del worktree en Windows**: no trae `node_modules` ni `.env`; el usuario hizo
  `pnpm install` + `npx prisma generate` + copió `.env`. `pnpm build` falla por EPERM al
  renombrar el engine de Prisma si el dev server está abierto (bloqueo de archivo); usar
  `pnpm exec next build` directo. Hace falta `pnpm exec next typegen` para limpiar errores
  `RouteContext` en un worktree recién instalado.
- **FEEDBACK DE PROCESO (grave, el usuario acabó muy enfadado, ~3h perdidas):**
  - **No improvisar: replicar la referencia.** La agenda es el design system. Hay que copiar
    su markup y clases EXACTAS (su `<Link>`, `text-xs`, etc.), no reimplementar con otro
    elemento ni inventar tamaños (`text-lg`, `text-[13px]`, minúsculas, paddings a ojo).
  - **Verificar visualmente contra la agenda antes de decir "hecho"** — no basta con
    `tsc`/`build`.
  - **Cambiar SOLO lo pedido.** Quité el botón Agenda, la pestaña Dados y reescribí actions
    sin que me lo pidieran → mucha frustración. No tocar funcionalidad cuando piden estilos.
  - **No marear con preguntas/menús** ni con disculpas repetidas.
- **Idioma**: español de España, tuteo estricto. Se me coló voseo otra vez (4ª); reforzado
  en memoria `feedback_tono.md`.

## PENDIENTE / estado actual (importante para retomar)
- **Las pestañas de `patient-detail.tsx` están ROTAS**: quedaron como un `<Link>` mal
  formado (`type="button"`, `onClick`, `href=""`) con `text-red-500 text-[8px]` de prueba.
  Hay que dejarlas limpias: elemento correcto (`<button>` para tabs de estado, o `<Link>`
  si se hacen rutas) con la clase EXACTA de la agenda (`font-mono text-xs font-semibold
  uppercase tracking-wider`, activo `bg-card text-foreground shadow-sm`).
- Confirmar el fix de Tailwind/`@source` (ver Learnings).
- Crítica de diseño pendiente del propio usuario: el panel de detalle se ve **vacío**
  (mucho hueco bajo 3 tarjetas en Resumo). Sugerido: meter la lista de próximas/últimas
  consultas dentro de Resumo. No implementado.
- Nada commiteado desde la reescritura `fa7a9a7` salvo lo que el usuario haya hecho; los
  últimos cambios (app-shell full-height, divisor, breadcrumb) pueden estar sin commitear.

## Key Files
app/(dashboard)/pacientes/layout.tsx
app/(dashboard)/pacientes/page.tsx
app/(dashboard)/pacientes/[id]/page.tsx
app/(dashboard)/pacientes/actions.ts
components/patients/patient-list.tsx
components/patients/patient-detail.tsx
components/patients/patient-sheet.tsx
components/app-shell.tsx
components/layout/breadcrumb.tsx
lib/patients/derive.ts
lib/modules/patients/service.ts
app/globals.css
tests/patients-derive.test.ts
docs/superpowers/specs/2026-06-08-vista-pacientes-fase1-design.md
docs/superpowers/plans/2026-06-08-vista-pacientes-fase1.md
