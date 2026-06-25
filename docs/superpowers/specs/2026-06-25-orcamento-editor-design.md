# Editor profesional de orçamento — Diseño

**Fecha:** 2026-06-25
**Estado:** Aprobado (pendiente de plan de implementación)

## Problema

El formulario de orçamento actual (`/orcamentos`) solo permite **una línea**, usa estilos fuera
del design system (`bg-white`, `bg-red-700`) y vive como página global que obliga a elegir paciente
con un `<select>`. No produce presupuestos profesionales como el template institucional del Dr. Darcy
(tabla multi-línea, subtotal/desconto/total, forma de pagamento, validade, observações).

El backend ya está preparado: `Quote` tiene `lines` (`QuoteLine`: description, quantity,
unitPriceCents, totalPriceCents, catalogItemId opcional), `discountCents`, `paymentMethod`,
`validityDays`, `notes`, número automático. El PDF (`QuoteDocument` vía `/api/pdf/orcamentos/[id]`)
ya renderiza el documento completo desde `getQuote`. Falta la UI de creación/edición multi-línea.

## Alcance

**Incluido:** editor profesional de orçamento dentro del contexto del paciente — crear, editar,
listar, borrar, PDF; tabla multi-línea con edición inline y conexión al catálogo.

**Excluido (YAGNI):**
- Estado del orçamento (aprobado/rechazado/pendiente): `Quote` no tiene campo `status`. No se
  añade ahora; requeriría migración + workflow propio.
- Sidebar y páginas top-level (`/orcamentos`, `/receitas`, `/atestados`): no se tocan en esta entrega.
- Receitas y atestados: son documentos de formulario simple; pasada posterior con patrón `Sheet`.

## Ubicación y rutas

El editor multi-línea es un documento de página completa (espejo del PDF), no cabe en un panel
lateral. Por eso vive en rutas dedicadas:

- **Tab "Orçamentos" del paciente** (`components/patients/patient-detail.tsx`): lista los orçamentos
  del paciente (Nº, fecha, total) con acciones **PDF · Editar · Excluir** y botón **`+ Novo orçamento`**.
  Estado vacío con CTA al editor.
- **`/pacientes/[id]/orcamentos/novo`**: editor en blanco.
- **`/pacientes/[id]/orcamentos/[quoteId]`**: mismo editor, editando un orçamento existente.

## El editor (estructura calcada del template institucional)

1. **Cabecera**: Nº (automático, "novo" hasta guardar) · Data (issueDate, hoy por defecto).
2. **Bloque paciente**: Nome · Telefone · CPF · Prontuário — **solo lectura**, derivados del paciente.
   Sin `<select>` de paciente (ya estamos en su contexto).
3. **Tabla de líneas** — columnas `# · Descrição · Qtd · Valor unit. · Valor total · ✕`:
   - Selector con **búsqueda del catálogo**: al elegir un ítem autocompleta descripción + `priceCents`.
   - Admite **línea libre** (descripción tecleada a mano, sin `catalogItemId`).
   - `Qtd` y `Valor unit.` editables inline; `Valor total = quantity * unitPriceCents` calculado.
   - Botón **`+ Adicionar linha`**.
4. **Totales** (en vivo): **Subtotal** (suma de líneas) · **Desconto** (editable) ·
   **Total** (subtotal − desconto).
5. **Pie**: Forma de pagamento · Validade do orçamento (dias, default 30) · Observações.
6. **Acciones**: `Salvar` · `Cancelar` · acceso a `PDF` tras guardar.

## Componentes y datos

- **Componente cliente** (p.ej. `components/patients/quotes/quote-editor.tsx`): mantiene las líneas
  en estado (array), con add/remove y edición inline. Totales recalculados al vuelo con `formatBRL`.
  Internamente trabaja en centavos; muestra BRL formateado.
- **Selector de catálogo por línea**: reutiliza el patrón de selección de catálogo del odontograma;
  recibe la lista de `CatalogItem` (ya disponible: `name`, `priceCents`, `isActive`).
- Al guardar, una sola server action recibe un **payload tipado** (objeto con líneas estructuradas),
  no `FormData` plano.

## Backend

- `createQuote(input)` — ya existe, soporta multi-línea. Sin cambios.
- **`updateQuote(id, input)`** — NUEVO en `lib/modules/quotes/service.ts`: actualiza campos escalares
  (issueDate, paymentMethod, validityDays, discountCents, notes) y **reemplaza las líneas**
  (borra las existentes + recrea desde el input). Mantiene número e id.
- `getQuote(id)` / `deleteQuote(id)` — ya existen.
- **Server actions scoped al paciente** en `app/(dashboard)/pacientes/[id]/actions.ts`:
  - `saveQuoteAction(input)` — crea (sin quoteId) o edita (con quoteId); `revalidatePath('/pacientes/[id]')`.
  - `deleteQuoteAction(quoteId, patientId)` — `revalidatePath('/pacientes/[id]')`.

## Flujo

1. Usuario abre la ficha del paciente → tab Orçamentos → ve la lista (o estado vacío con CTA).
2. `+ Novo orçamento` → navega a `/pacientes/[id]/orcamentos/novo`.
3. Añade líneas (catálogo o libres), ajusta qtd/precio/desconto, completa pie → `Salvar`.
4. `saveQuoteAction` crea el `Quote` con sus líneas → revalida → vuelve a la ficha.
5. Desde la lista: `PDF` (ruta existente), `Editar` (carga el editor con el quote), `Excluir`.

## Manejo de errores

- Validación de líneas vacías: `createQuote` ya lanza si no hay líneas; el editor deshabilita
  `Salvar` sin al menos una línea con descripción.
- Errores de la action se capturan en el cliente (patrón `useTransition` + estado de error, como
  `PatientSheet`) y se muestran inline.
- `Excluir` pide confirmación (`confirm`), como el patrón existente.

## Verificación

- Crear un orçamento con varias líneas (catálogo + libre) → aparece en la lista del paciente con
  total correcto y genera el PDF institucional.
- Editar uno existente → cambios persistidos, líneas reemplazadas.
- Borrar → desaparece de la lista.
- Estado vacío muestra el CTA.
- Cambiar de tab en la ficha no recarga la página (arreglo del bug `<Link href="">` → `<button>`).
