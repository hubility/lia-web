# Session: Rediseño UI/UX de la vista de Catálogo
Date: 2026-06-24 23:30
Project: lia-web

## Goal
Rediseñar la pantalla de Catálogo (`/catalogo`), que estaba sin estilar (raw Tailwind,
inline-edit de todo, ignoraba el design system), para que sea nativa de Lia, escaneable y
con jerarquía real. Solo rediseño visual; el `scope` tooth/general del spec 06-10 queda fuera.

## Decisions
- **Lectura + edición en `Sheet`, no inline-edit.** Patrón estándar de admin (Stripe/Square)
  y, sobre todo, el que ya usa la app (pacientes/agenda). El inline-edit-de-todo es
  sobreingeniería propensa a errores para ~15 ítems.
- **Esqueleto: full-bleed columnar, NO columna estrecha centrada.** Una columna centrada
  (`mx-auto max-w-2xl`) crea un "pegote" flotando en un lienzo ancho — error de aplicar una
  técnica de *prosa* (medida acotada) a una *tabla de datos*. Las tablas van full-bleed con
  columnas alineadas, como el resto del sistema y como la referencia de Frotas que aportó el
  usuario. El usuario validó esta dirección.
- **Rejilla CSS compartida** (`grid-cols-[1fr_6rem_9rem]`) entre la cabecera de columnas y
  cada fila → columnas perfectamente alineadas (Procedimento | Duração | Preço). Adiós a las
  "guías de puntos" (dot leaders), que eran un idioma forastero y subrayaban el vacío.
- **Estado por peso del nombre, sin badges ni color.** Activo = `text-foreground`; inativo =
  `text-muted-foreground` + sección "Inativos · N" al final. Nunca un "ATIVO" verde repetido
  (color que decora en vez de informar).
- **Precio como héroe**: mono `tabular-nums`, semibold, alineado a la derecha en su columna.
  `priceCents === 0` → "sob consulta" (mono muted), nunca "R$ 0,00".
- **Rail izquierdo cuadrado** con el título: la lista va en un wrapper `-mx-2` con `px-2` en
  filas/cabecera, para que el texto alinee con `h1` y el hover-bg tenga 8px de aire.
- **Toggle activar/inativar movido al Sheet**; alta/edición desde `Sheet` (calcado de
  `patient-sheet`); breadcrumb con tilde via mapa `LABEL` en `breadcrumb.tsx`.

## Learnings
- **ERROR DE PROCESO (el usuario lo señaló varias veces y con razón): trabajé al revés.**
  Salté a codificar antes de leer el patrón canónico de página, inventé un idioma propio
  (leaders, pegote centrado) y **pulí el adorno antes de montar el esqueleto**. El proceso
  profesional es: discovery (sistema + patrón canónico + referencia) → modelar contenido y
  estados → fijar y validar el esqueleto → construir una vez → pulir al final. **Cómo aplicar:
  esqueleto antes que adorno; nativo antes que original; analizar antes de actuar.**
- **Full-bleed con columnas alineadas tolera el hueco horizontal nombre↔precio** porque el ojo
  lee verticalmente por las columnas; lo que hacía insoportable ese hueco era el *leader*, que
  lo dibujaba. Quitarlo + alinear columnas lo resuelve (lección extraída de la vista de Frotas).
- **`--color-success` y demás tokens están mapeados en `@theme`** de `globals.css`, así que
  `bg-success`, `text-muted-foreground`, etc. funcionan; NO usar `bg-white`/`text-zinc-500`
  crudos (rompen el dark y desentonan).
- **Patrón canónico de página** (de `agenda-header.tsx`): cabecera `flex justify-between`,
  botón primario `h-9 bg-primary px-4` a la derecha, etiquetas mono uppercase
  `text-[11px] font-semibold tracking-wider`, `—` para vacíos, empty-state mono centrado.
- Quedó PENDIENTE (no analizado a fondo): el diseño del propio **Sheet/formulario** (orden de
  campos, "preço sob consulta" explícito, validación, confirmación de borrado nativa fea), los
  **estados/casos límite** (nombres largos, responsive, claro/oscuro) y el **feedback (toast)**
  de las acciones. Son la siguiente pasada (UX 11–19 + polish de la lista consolidada).

## Key Files
app/(dashboard)/catalogo/page.tsx
components/catalog/catalog-list.tsx
components/catalog/catalog-sheet.tsx
app/(dashboard)/catalogo/actions.ts
components/layout/breadcrumb.tsx
