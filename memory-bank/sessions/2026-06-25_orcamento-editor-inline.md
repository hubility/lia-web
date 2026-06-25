# Session: Editor profesional de orçamento (inline en la ficha del paciente)
Date: 2026-06-25 02:00
Project: lia-web

## Goal
Reemplazar el formulario de orçamento de 1 línea (basura) por un editor profesional multi-línea
con edición inline, conexión al catálogo y totales en vivo, **dentro de la pestaña Orçamentos del
paciente**. El objetivo siguiente (sesión nueva, contexto limpio) es **repetir exactamente lo mismo
para Receitas**.

## Decisions
- **El editor va INLINE dentro de la pestaña, NO en ruta dedicada.** Primero se hizo en rutas
  `/pacientes/[id]/orcamentos/novo` y `[quoteId]` — el usuario lo odió: al crear, desaparecía toda
  la ficha y el formulario quedaba flotando solo en el vacío ("pegote en medio del espacio"). Se
  borraron esas rutas. Ahora la pestaña alterna lista ↔ editor con un estado
  `editingQuote: "new" | QuoteEditorQuote | null`; cabecera, pestañas y sidebar permanecen.
- **NO tocar la barra de pestañas.** Cambiar `<Link href="">` por `<button>` (aunque era el patrón
  correcto y arreglaba un bug latente) alteró el tamaño del texto y enfureció al usuario. Se
  revirtió al `<Link href="">` original. Regla: cambios quirúrgicos, no "mejorar" lo que no se pidió.
- **Empty state con patrón estándar:** card `border-dashed`, icono en círculo muteado, título,
  descripción de una línea, **botón primario real** (no un link suelto). Cuando está vacío se oculta
  el botón "Novo orçamento" de la cabecera para no duplicar CTA.
- **Botón "Gerar orçamento" del odontograma eliminado** a petición del usuario (redundante con el
  nuevo flujo). Quedó la función `generateQuoteFromPlannedAction` en actions/servicio sin usar — NO
  se borró (no era parte del encargo).
- Backend: `createQuote` ya soportaba multi-línea; se añadió `updateQuote` (reemplaza líneas con
  `deleteMany: {}` + `create`). Server actions scoped al paciente (`saveQuoteAction`,
  `deleteQuoteAction`) con `revalidatePath('/pacientes/[id]')`. Payload tipado, no FormData.

## Work Done
- `lib/quotes/editor.ts` (lógica pura: `lineTotalCents`, `subtotalCents`, `normalizeLines`) + tests.
- `updateQuote` en `lib/modules/quotes/service.ts`.
- `saveQuoteAction` / `deleteQuoteAction` en `app/(dashboard)/pacientes/[id]/actions.ts`.
- `components/patients/quotes/quote-editor.tsx`: editor inline (props `onCancel`/`onSaved`, sin
  router.push), tabla multi-línea, picker de catálogo con búsqueda, línea libre, totales en vivo,
  forma de pagamento / validade / observações.
- `patient-detail.tsx`: pestaña Orçamentos alterna lista↔editor; lista con PDF/Editar/Excluir;
  empty state nuevo; revert de la barra de pestañas.
- `odontogram-tab.tsx`: quitado el botón "Gerar orçamento" + imports/vars huérfanas.
- Scrollbar: utilidad `.scrollbar-slim` en `app/globals.css`; en `patient-list.tsx` el aside pasó de
  `pr-6` a `pr-3` y el contenedor scroll lleva `scrollbar-slim ... pr-1` (antes: scrollbar gris gordo
  por defecto + hueco de 24px hasta el borde = "scrollbar y después una línea").

## Learnings
- **`getPatientDetail` incluye `quotes` con `lines: true` pero `prescriptions` SIN `items`.** Para
  el editor inline de Receitas habrá que añadir `include: { items: { orderBy: { position: "asc" } } }`
  a prescriptions en `lib/modules/patients/service.ts` (línea ~38), si no, el modo edición no tendrá
  los items.
- `require()` no refleja los exports ESM de `@hugeicons/core-free-icons` (todo da MISSING). Para
  verificar nombres de iconos, grep en `node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts`
  (`declare const XxxIcon`). Iconos confirmados usados: Add01Icon, File01Icon, Delete02Icon,
  Search01Icon, PlusSignIcon, Cancel01Icon, Invoice01Icon, PencilEdit01Icon.
- Tests del repo son lógica pura en `tests/*.test.ts` (node, sin DB). Servicios/acciones/UI se
  verifican con `npx tsc --noEmit` + `npx eslint <archivos>` + build. `globals.css` ya tiene
  `button,input,select,textarea { font: inherit }`.
- Dinero siempre en centavos; `formatBRL` / `parseCents` en `lib/money.ts`. Inputs de dinero:
  `defaultValue={(cents/100).toFixed(2)}` + `onChange parseCents` (uncontrolled, evita salto de cursor).

## Próximos pasos — replicar para RECEITAS (el encargo de la sesión nueva)
1. `lib/modules/patients/service.ts`: añadir `include: { items: { orderBy: { position: "asc" } } }`
   a `prescriptions` en `getPatientDetail`.
2. `lib/modules/prescriptions/service.ts`: añadir `updatePrescription(id, input)` (mirror de
   `updateQuote`: reemplaza items con deleteMany + create). Ya existen `createPrescription` /
   `deletePrescription`. `PrescriptionInput` = `{ patientId, issueDate, notes?, items:[{medicine,
   instructions, position}] }`.
3. `app/(dashboard)/pacientes/[id]/actions.ts`: añadir `savePrescriptionAction` /
   `deletePrescriptionAction` scoped (revalidatePath de la ficha), tipo `SavePrescriptionInput`.
4. `components/patients/prescriptions/prescription-editor.tsx`: editor INLINE (props
   `patient`, `prescription?`, `onCancel`, `onSaved`). Receita es más simple que orçamento: NO hay
   totales, NO catálogo, NO dinero. Es multi-ítem: cada ítem = medicamento + instruções (+ posición).
   Cabecera (Data) + bloque paciente read-only + lista de ítems (medicine/instructions, añadir/quitar)
   + Observações + Salvar/Cancelar.
5. `patient-detail.tsx`: pestaña `receitas` (hoy es un `<Section>` read-only) → alternar lista↔editor
   igual que orçamentos, con estado `editingPrescription`. Lista con PDF (`/api/pdf/receitas/[id]`) +
   Editar + Excluir + el MISMO empty state (icono, título "Nenhuma receita ainda", botón primario).
6. NO tocar barra de pestañas. Editor inline, nunca ruta dedicada. Verificar con tsc + eslint + build.

## Estado de git
Rama `feat/orcamento-editor`. Hay commits de la primera versión (con rutas dedicadas, Tasks 1–5),
pero el refactor a inline + borrado de rutas + fixes (scrollbar, empty state, quitar botón odontograma)
**están SIN commitear**. Spec: `docs/superpowers/specs/2026-06-25-orcamento-editor-design.md`.
Plan: `docs/superpowers/plans/2026-06-25-orcamento-editor.md` (describe la versión de rutas, ya
superada por el enfoque inline).

## Key Files
components/patients/patient-detail.tsx
components/patients/quotes/quote-editor.tsx
lib/quotes/editor.ts
tests/quote-editor.test.ts
lib/modules/quotes/service.ts
app/(dashboard)/pacientes/[id]/actions.ts
components/patients/odontogram/odontogram-tab.tsx
components/patients/patient-list.tsx
app/globals.css
lib/modules/patients/service.ts
lib/modules/prescriptions/service.ts
