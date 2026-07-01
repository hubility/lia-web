# Documentos PDF clínicos (orçamento · receita · atestado) — Diseño

**Fecha:** 2026-07-01
**Estado:** Aprobado (pendiente de plan de implementación)

## Problema

La generación de PDF de orçamentos, receitas y atestados está implementada pero es texto plano:
sin logo, sin iconos, sin la tabla con círculos numerados, sin la barra roja de pie, sin la
tipografía de marca y con la fuente por defecto (Helvetica). No se parece al material institucional
del Dr. Darcy Mavignier. El objetivo es que los tres documentos se generen **iguales a las imágenes
de referencia** (orçamento y receita), y el atestado con el mismo lenguaje de marca.

El backend ya provee todos los datos: `getQuote`, `getPrescription`, `getMedicalCertificate` y
`getClinicProfile`, servidos por las rutas `app/api/pdf/{orcamentos,receitas,atestados}/[id]/route.ts`.
No hay que tocar el modelo de datos ni los editores.

## Alcance

**Incluido:** reescritura de la capa PDF (`lib/pdf/*`) para producir los tres documentos con
fidelidad de marca. Registro de fuente Outfit, iconos vectoriales SVG, encabezado con el logo real,
caja de paciente, caja de firma, barra de pie roja, y las plantillas de los tres documentos.

**Excluido:**
- Editores / formularios de creación y edición: no se tocan.
- Modelo de datos y migraciones: no se tocan.
- Rutas API: se mantienen; a lo sumo ajustes menores si el render lo exige.

## Motor: `@react-pdf/renderer`

Se mantiene `@react-pdf/renderer`, que ya es el motor en uso. Todo lo de las imágenes (cajas grises
redondeadas, círculos rojos numerados, tabla con bordes, barra de pie, iconos de línea, logo,
fuentes) es reproducible con sus primitivas (`View`, `Text`, `Image`, `Svg`, `Path`, `Font`).

## Assets y tipografía

- **Logo:** `public/logo/logoDarcy.png` (600×215). Trae el lockup completo (marca + "Dr. Darcy
  Mavignier" + "odontologia integrada"). En el encabezado se usa **solo la imagen**; **no** se
  vuelve a escribir `clinic.subtitle` como texto (evita duplicarlo). Se carga desde el filesystem en
  el server y se pasa a `<Image>`.
- **Fuente Outfit:** los `.ttf` estáticos ya están en `public/fonts/Outfit/static/` (se usan
  Regular 400, Medium 500, SemiBold 600, Bold 700) y se registran con `Font.register`. Es la fuente
  de marca (la app ya usa Outfit). El wordmark script "Darcy Mavignier" vive dentro de la imagen del
  logo, así que no hace falta registrar una fuente script.

## Arquitectura de la capa PDF (`lib/pdf/`)

Sistema de piezas compartidas reutilizadas por los tres documentos:

- **`brand.ts`** — tokens: rojo `#D32F2F`, gris marca `#9E9E9E`, grises de caja/borde, tinte rojo
  claro para la fila Total, tamaños y espaciados. Fuente `Outfit`.
- **`fonts.ts`** — `Font.register` de Outfit (4 pesos) leyendo de `public/fonts/Outfit/static/`.
  Import con efecto lateral desde cada documento.
- **`icons.tsx`** — iconos de línea como `<Svg viewBox><Path/></Svg>` nativos de `@react-pdf`,
  parametrizados por `size` y `color` (stroke). Set necesario: `user`, `phone`, `idCard`, `folder`,
  `calendar`, `creditCard`, `chat`, `pin`, `globe`, `tooth`. Se extraen los `path` del set libre ya
  usado en la app (Hugeicons) o equivalentes.
- **`header.tsx`** — fila: `<Image>` del logo a la izquierda + título rojo a la derecha; debajo del
  título, línea "Data: __/__/__ · Nº ___" según el documento.
- **`patient-box.tsx`** — caja gris redondeada; filas `icono + label + valor`. Campos parametrizados
  por documento.
- **`signature-box.tsx`** — caja gris redondeada, alineada a la derecha: diente-en-círculo rojo
  (icono `tooth` dentro de círculo con borde rojo) + `clinic.name` en negrita rojo + `clinic.specialty`
  + `clinic.cro` + línea de firma + "Assinatura".
- **`footer.tsx`** — barra: línea roja superior + tres grupos `icono+texto` (teléfono, dirección,
  web) + tagline centrado en rojo. Renderiza con `position:absolute` + `fixed` (ver Paginación).
- Cada pieza define su propio `StyleSheet` a partir de los tokens de `brand.ts` (estilos
  co-localizados). Los antiguos `styles.ts` y `shared.tsx` quedan huérfanos tras la migración y se
  eliminan.
- **`quote-document.tsx`**, **`prescription-document.tsx`**, **`certificate-document.tsx`** — las
  tres plantillas que componen las piezas.
- **`render.ts`**, **`utils.ts`** — se mantienen (buffer + `formatDate`/`formatBRL`). `utils.ts`
  suma `calcAge(birthDate)` para la Idade de la receita.

## Documento: Orçamento

Espejo de la imagen de referencia:

1. **Header:** logo + "ORÇAMENTO ODONTOLÓGICO" + "Data: {issueDate} · Nº {number}".
2. **Caja de paciente:** Paciente / Telefone / CPF / Prontuário (iconos `user`/`phone`/`idCard`/`folder`).
3. **Tabla** — columnas `Item · Descrição · Qtd. · Valor unit. · Valor total`:
   - Cabecera con texto rojo y borde inferior rojo.
   - **Una fila por `QuoteLine` real** (N dinámico). El `Item` es un **círculo rojo numerado**.
   - Sin filas vacías de relleno (las 6 de la plantilla son solo para rellenar a mano).
   - **Tabla ajustada al contenido** (sin marco de altura mínima).
4. **Caja de totales** (alineada a la derecha): Subtotal · Desconto · **Total** (fila resaltada con
   tinte rojo claro y texto rojo en negrita). Subtotal = Σ `totalPriceCents`; Total = Subtotal − `discountCents`.
5. **Bloque inferior:** columna izquierda con iconos — Forma de pagamento (`creditCard`), Validade do
   orçamento (`calendar`), Observações (`chat`); columna derecha: caja de firma.
6. **Footer** con tagline "PLANEJAMENTO CLARO PARA O SEU TRATAMENTO".

## Documento: Receita

1. **Header:** logo + "RECEITA ODONTOLÓGICA" + "Data: {issueDate}".
2. **Caja de paciente:** Paciente (`user`) + Idade (`calendar`, calculada desde `patient.birthDate`;
   "-" si no hay) + Prontuário (`folder`).
3. **"℞ Prescrevo:"** — símbolo Rx destacado en rojo a la izquierda del título.
4. **Ítems** — lista numerada (círculo rojo) por cada `PrescriptionItem` (orden por `position`):
   `medicine` en negrita + `instructions` debajo. N dinámico, fluye y pagina solo.
5. **Separador rojo** + **Observações** a la izquierda; **caja de firma** a la derecha.
6. **Footer** con tagline "CUIDAR DO SEU SORRISO É A NOSSA MISSÃO".

## Documento: Atestado

Sin imagen de referencia; se diseña con el mismo lenguaje de marca:

1. **Header:** logo + "ATESTADO ODONTOLÓGICO" + "Data: {issueDate}".
2. **Caja de paciente:** Paciente / CPF (si existe) / Prontuário.
3. **Cuerpo:** texto legal del atestado en párrafo, con el periodo de afastamento
   ({absenceStartDate}–{absenceEndDate}), la frase de cuidados odontológicos y **CID: {cid}**.
   `notes` opcional debajo.
4. Línea de ciudad y fecha: "{city}, {issueDate}."
5. **Caja de firma** a la derecha.
6. **Footer** con los datos de contacto (sin tagline, al no haber uno definido para el atestado).

## Control de tablas, contenido indeterminado y paginación

El número de ítems es indeterminado; el layout se controla así:

- **Filas dinámicas:** una fila/ítem por registro real, sin relleno.
- **`wrap={false}` por fila:** una fila nunca se parte entre dos páginas.
- **Paginación automática:** `@react-pdf` continúa en la página siguiente cuando el contenido desborda.
- **Cabecera de columnas:** se renderiza una vez al inicio de la tabla. En el raro caso de un
  orçamento multipágina, las filas continúan en la página siguiente sin repetir la cabecera (evita el
  solape que provocaría un `fixed` a media página).
- **Footer independiente del contenido:** el `Page` reserva `paddingBottom` con la altura del pie; el
  componente de pie va `position:absolute` + `bottom` + `fixed`. Así:
  - Contenido corto → el pie queda anclado al fondo físico de la página (queda hueco en blanco encima).
  - Contenido largo → el mismo pie se repite anclado al fondo de cada página.

## Criterios de verificación

- Los tres endpoints `GET /api/pdf/{orcamentos,receitas,atestados}/[id]` devuelven un PDF válido
  (`content-type: application/pdf`) sin error de render.
- **Orçamento** con 1 y con 15 líneas: 15 líneas paginan correctamente (las filas no se parten) y el
  pie queda anclado abajo en todas las páginas; los círculos numerados son correlativos;
  Subtotal/Desconto/Total cuadran.
- **Receita** con múltiples ítems ordenados por `position`; Idade correcta (y "-" sin `birthDate`);
  el símbolo ℞ se renderiza.
- **Atestado** renderiza periodo, CID, ciudad y fecha.
- Comparación visual contra las imágenes de referencia: logo, colores de marca, cajas, iconos y
  barra de pie presentes y alineados.
- `pnpm build` compila sin errores de tipos.
