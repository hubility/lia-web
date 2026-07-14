# Session: Catálogo de medicamentos y CID — diseño (sin implementar)
Date: 2026-07-14
Project: lia-web

## Goal
Petición del cliente por WhatsApp: *"criar um catálogo de medicamentos e CID, para eu cadastrar
o que mais usamos"*. Diseñar (no implementar) la ampliación del catálogo a 3 tabs, el modelo de
datos de medicamentos y CID, su relación con receitas/atestados, y el picker con búsqueda en el
editor de receita. **No se escribió una línea de código de la feature.**

## Decisions

Ocho decisiones, todas aprobadas por el usuario:

1. **Seed del CID descargado de fuente oficial** (DATASUS/CID-10, capítulo K00–K14 odontológico),
   editable/desactivable después. **NUNCA tecleado de memoria del modelo**: son códigos clínicos
   que acaban en un atestado firmado.
2. **`cidCodeId String?` en `MedicalCertificate`** — el atestado apunta al CID del catálogo.
3. **El PDF del atestado imprime código + nombre** (`CID: K04.0 — Pulpite`), no solo el código
   como hoy. **Consecuencia no evidente:** obliga a guardar también la descripción como snapshot
   (`cidDescription String?`), porque hoy `MedicalCertificate.cid` solo contiene `"J06"`.
4. **Tres tabs en `/catalogo`**: Procedimentos | Medicamentos | CID (no dos).
5. **`Medication { name, defaultPosology, isActive }`** — espejo de `CatalogItem`. La posología
   por defecto es el valor real de la feature: al elegir el medicamento se autocompletan
   medicamento *e* instrucciones, y no hay que reteclear la posología.
6. **`medicationId String?` en `PrescriptionItem`** + snapshot de texto, calcado de
   `QuoteLine.catalogItemId` (`onDelete: SetNull`). El texto congelado es la verdad histórica del
   documento emitido; la FK es trazabilidad. Borrar del catálogo nunca corrompe una receita.
7. **Tabs client-side con `useState`**, copiando el pill-group de `patient-detail.tsx`, NO rutas
   anidadas. Razón: es una app interna de consultorio — nadie marca `/catalogo/medicamentos` como
   favorito, ni comparte la URL, ni usa "atrás" para cambiar de tab, y las 3 tablas juntas son
   ~100 filas. Las ventajas de las rutas (deep-link, back, carga parcial) son de web pública y
   aquí no valen nada; lo que manda es *nativo, no pegado* (PRODUCT.md).
8. **Reusar los pickers que ya existen** (`quote-editor.tsx:213-246`, `patient-combobox.tsx`).
   No instalar `cmdk` ni shadcn `Command`.

**Matiz de diseño (diferencia real frente a `quote-editor`):** en orçamentos, editar el texto de
una línea rompe el vínculo con el catálogo (`catalogItemId: null`). En una receita NO puede ser
igual: **ajustar la posología a un paciente concreto es el uso normal** y debe conservar el
vínculo. Solo editar el *nombre* del medicamento lo rompe.

## Learnings

- **ERROR DE PROCESO GRAVE (el usuario lo señaló repetidamente): hablé sin verificar.** Presenté
  como hechos cosas sacadas del informe de un subagente sin haber leído los archivos, y expliqué
  un error de la API inventándome la causa. "Pareces un loro." La verificación va ANTES de la
  afirmación, siempre.
- **ERROR DE PROCESO IGUAL DE GRAVE: me retracté de ideas correctas bajo presión.** Al ser
  corregido en el *proceso*, retiré las tres propuestas que el usuario consideraba buenas (seed
  de CID, FK del CID, código+nombre en el PDF). Eso convierte un "sí" mío en ruido sin
  información. **Distinguir siempre: crítica al proceso ≠ el contenido estaba mal.**
- **Preguntas que no son preguntas.** Planteé como disyuntiva (FK+snapshot vs solo snapshot) algo
  que solo tiene una respuesta correcta. Si no hay alternativa legítima, no se pregunta: se afirma
  y se justifica.
- **Justificar con criterios del sistema equivocado.** Defendí las rutas anidadas con argumentos
  de web pública (SEO, deep-link, back button) en una app interna de un consultorio. El criterio
  correcto era la coherencia con el patrón que la app ya tiene.

## Estado del código verificado (leído de primera mano)

- `PrescriptionItem` (`prisma/schema.prisma:175-182`): `medicine` + `instructions` + `position`,
  todo texto libre. **Sin FK a ningún catálogo.**
- `QuoteLine` (`prisma/schema.prisma:152-162`): `catalogItemId String?` + `onDelete: SetNull` +
  snapshot desnormalizado. **Es el patrón a copiar.**
- `MedicalCertificate.cid` (`prisma/schema.prisma:190`): `String` obligatorio; el PDF imprime
  `CID: {certificate.cid}` (`lib/pdf/certificate-document.tsx:41`) — solo el código.
- `prescription-editor.tsx:122-135`: dos `<input>` planos, sin picker ni búsqueda.
- `certificate-editor.tsx:127`: `<input>` de CID con placeholder `"Ex.: J06"`.
- `patient-detail.tsx:124-137`: el pill-group de tabs usa `<Link href="">` con `onClick` —
  debe ser `<button>`.
- **No existe** ninguna entidad de medicamento ni de CID en el schema.

## Pendiente / no verificado

- **La fuente de descarga del CID-10 NO está comprobada.** `WebSearch` falla en el entorno
  (`400: effort 'xhigh' no soportado con thinking desactivado`) y `WebFetch` fuerza HTTPS,
  mientras que DATASUS (`www2.datasus.gov.br`) solo sirve por HTTP → `ECONNREFUSED`. Hay que
  validar la URL y el formato del dataset antes de escribir el seed.
- No hay spec escrito ni plan de implementación.

## Key Files
prisma/schema.prisma
components/patients/prescriptions/prescription-editor.tsx
components/patients/certificates/certificate-editor.tsx
components/patients/quotes/quote-editor.tsx
components/patients/patient-detail.tsx
components/catalog/catalog-list.tsx
components/catalog/catalog-sheet.tsx
app/(dashboard)/catalogo/page.tsx
lib/pdf/certificate-document.tsx
lib/modules/prescriptions/service.ts
prisma/seed.ts
