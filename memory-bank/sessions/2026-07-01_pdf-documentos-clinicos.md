# Session: Diseño de PDFs clínicos (orçamento/receita/atestado) con fidelidad de marca
Date: 2026-07-01 20:07
Project: lia-web

## Goal
La generación de PDF de orçamentos, receitas y atestados era texto plano (Helvetica, sin logo/iconos/tabla/pie) y no se parecía al material institucional del Dr. Darcy. Objetivo de esta sesión: brainstorming + spec + plan para reescribir la capa PDF y que los tres documentos salgan iguales a las imágenes de referencia. **No se escribió código de implementación todavía**: solo spec y plan, listos para ejecutar en sesión nueva.

## Decisions
- **Motor: seguir con `@react-pdf/renderer`** (ya instalado, ya en uso). Se descartó explícitamente hablar de Puppeteer/Chromium — el usuario lo consideró ruido; no es necesario para este layout.
- **Logo:** el usuario colocó `public/logo/logoDarcy.png` (600×215). Trae el lockup completo incluido el subtítulo "odontologia integrada" → en el header se usa **solo la imagen**, no se reescribe `clinic.subtitle` como texto (evitar duplicado).
- **Fuente:** Outfit estático ya presente en `public/fonts/Outfit/static/` (Regular/Medium/SemiBold/Bold). Se registra con `Font.register` leyendo por `process.cwd()`.
- **Tablas dinámicas, no filas fijas:** las 6 filas de la plantilla son artefacto del formulario en blanco. En documento generado → 1 fila por ítem real, `wrap={false}` por fila, sin relleno. El usuario preguntó específicamente por esto (nº de ítems indeterminado).
- **Cabecera de tabla:** se renderiza UNA vez, no con `fixed`. `fixed` fija una posición constante y a media página se solaparía en la página 2. Corregido en spec (yo había prometido "se repite" — es incorrecto).
- **Footer independiente del contenido:** `Page` con `paddingBottom` reservado + footer `position:absolute` + `bottom` + `fixed`. Contenido corto → pie anclado al fondo con hueco; largo → se repite en cada página. (El usuario preguntó explícitamente cómo se controla el pie con líneas indeterminadas.)
- **Estilos co-localizados:** cada pieza define su `StyleSheet` desde tokens de `brand.ts`; se abandona el `styles.ts`/`shared.tsx` global (se borran en la última tarea del plan).
- **℞ (Rx):** se dibuja con la fuente built-in `Times-Roman` (Outfit no trae el glifo); fallback documentado = componer "R" grande + "x" pequeño.
- **Idade (receita):** se calcula desde `patient.birthDate` con `calcAge` nuevo en `utils.ts`.

## Learnings
- **TONO — reincidencia grave (6ª vez):** se me escapó voseo rioplatense masivo en todo el brainstorming ("vos", "acá", "dejame", "buenísimo", "pasás"). El usuario es ESPAÑOL DE ESPAÑA y explotó ("deja de hablarme en panchito"). Regla estricta: español peninsular, tú-forma. Actualizada la memoria `feedback_tono.md`. Revisar SIEMPRE los cierres de mensaje y los imperativos.
- **No meter "basura":** el usuario rechaza contenido no solicitado (el hombre de paja de Chromium, exclusiones inventadas como "estado del orçamento", hex inventados, taglines inventados). Ser objetivo y quirúrgico también en specs.
- Las rutas `app/api/pdf/*/[id]/route.ts` ya hacen el fetch y pasan `{ clinic, quote|prescription|certificate }` con las relaciones correctas (`getQuote`→patient+lines, `getPrescription`→patient+items ordenados, `getCertificate`→patient). Solo hay que reescribir los componentes de `lib/pdf/`.
- Outfit se carga en la app vía `next/font/google` (no hay TTF locales de origen); por eso el usuario añadió la familia estática a `public/fonts/Outfit/static/`.
- Tests de PDF: entorno vitest `node`; se reusa `renderPdfToBuffer` y se verifica que el buffer empieza por `%PDF-`. La fidelidad visual exacta no es testeable → paso manual de comparación contra las imágenes.

## Work Done
- Brainstorming completo (motor, logo, fuentes, iconos, tablas, footer).
- Spec escrito y revisado (quitado el ruido de Chromium/exclusiones/hex/tagline): `docs/superpowers/specs/2026-07-01-pdf-documentos-clinicos-design.md`.
- Plan de implementación de 8 tareas con TDD y commits: `docs/superpowers/plans/2026-07-01-pdf-documentos-clinicos.md`.
- Actualizada memoria de tono (`feedback_tono.md`) con la 6ª reincidencia.
- **Pendiente:** ejecutar el plan (sesión nueva, contexto limpio).

## Key Files
docs/superpowers/specs/2026-07-01-pdf-documentos-clinicos-design.md
docs/superpowers/plans/2026-07-01-pdf-documentos-clinicos.md
lib/pdf/quote-document.tsx
lib/pdf/prescription-document.tsx
lib/pdf/certificate-document.tsx
lib/pdf/shared.tsx
lib/pdf/styles.ts
lib/pdf/utils.ts
public/logo/logoDarcy.png
public/fonts/Outfit/static/
app/api/pdf/orcamentos/[id]/route.ts
app/api/pdf/receitas/[id]/route.ts
app/api/pdf/atestados/[id]/route.ts
