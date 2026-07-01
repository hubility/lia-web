# Documentos PDF clínicos (orçamento · receita · atestado) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescribir la capa PDF (`lib/pdf/*`) para que orçamento, receita y atestado se generen con fidelidad de marca (logo, fuente Outfit, iconos, cajas, tabla con círculos numerados y barra de pie roja), iguales a las imágenes de referencia.

**Architecture:** Se mantiene `@react-pdf/renderer`. Se construye un conjunto de piezas compartidas (tokens de marca, registro de fuente, iconos SVG, header, caja de paciente, caja de firma, footer) que las tres plantillas componen. Cada pieza es un archivo enfocado con su `StyleSheet` co-localizado a partir de `brand.ts`. Los `styles.ts`/`shared.tsx` antiguos se eliminan al final, ya migrados.

**Tech Stack:** Next.js 16, React 19, `@react-pdf/renderer` v4 (`Document`, `Page`, `View`, `Text`, `Image`, `Svg`, `Path`, `Circle`, `Rect`, `Line`, `Font`), TypeScript, Vitest (entorno `node`).

## Global Constraints

- No tocar el modelo de datos, migraciones, editores/formularios ni la lógica de fetch de las rutas API. Las rutas ya pasan `{ clinic, quote | prescription | certificate }` a cada documento; solo cambian los componentes de `lib/pdf/`.
- Colores de marca exactos: rojo `#D32F2F`, gris `#9E9E9E`. Fuente de marca: **Outfit** (nunca ámbar, nunca Montserrat).
- Fuentes ya presentes en `public/fonts/Outfit/static/` (`Outfit-Regular.ttf` 400, `Outfit-Medium.ttf` 500, `Outfit-SemiBold.ttf` 600, `Outfit-Bold.ttf` 700). Logo en `public/logo/logoDarcy.png` (600×215, incluye el subtítulo "odontologia integrada": no duplicarlo como texto).
- Textos de los documentos en portugués (es material clínico brasileño): "ORÇAMENTO ODONTOLÓGICO", "RECEITA ODONTOLÓGICA", "ATESTADO ODONTOLÓGICO", "Prescrevo", "Assinatura", etc.
- Tablas/listas dinámicas: una fila por ítem real, sin filas de relleno. Cada fila `wrap={false}`. Footer `fixed` anclado al fondo.
- Comando de test dirigido: `npx vitest run <archivo>`. Suite completa: `pnpm test`. Build: `pnpm build`.
- Assets de fuente/logo se leen del filesystem con rutas basadas en `process.cwd()`.

---

### Task 1: Tokens de marca + registro de fuente Outfit

**Files:**
- Create: `lib/pdf/brand.ts`
- Create: `lib/pdf/fonts.ts`
- Test: `tests/pdf-base.test.ts`

**Interfaces:**
- Produces:
  - `brand` (objeto de tokens) desde `lib/pdf/brand.ts`: `brand.red`, `brand.gray`, `brand.ink`, `brand.muted`, `brand.boxBg`, `brand.boxBorder`, `brand.hairline`, `brand.redTintTotal`, `brand.white`, `brand.font` (`"Outfit"`), `brand.page.paddingX` (42), `brand.page.paddingTop` (40), `brand.page.paddingBottom` (96).
  - `lib/pdf/fonts.ts`: módulo con efecto lateral que llama `Font.register` para la familia `"Outfit"` (pesos 400/500/600/700) y `Font.registerHyphenationCallback`. Se importa con `import "@/lib/pdf/fonts"` desde cada documento.
- Consumes: nada.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/pdf-base.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Document, Page, Text } from "@react-pdf/renderer";
import { createElement as h } from "react";
import "@/lib/pdf/fonts";
import { brand } from "@/lib/pdf/brand";
import { renderPdfToBuffer } from "@/lib/pdf/render";

describe("pdf base", () => {
  it("expone tokens de marca", () => {
    expect(brand.red).toBe("#D32F2F");
    expect(brand.font).toBe("Outfit");
  });

  it("renderiza un PDF usando la fuente Outfit registrada", async () => {
    const doc = h(
      Document,
      null,
      h(Page, { size: "A4" }, h(Text, { style: { fontFamily: brand.font, fontWeight: 700 } }, "Olá"))
    );
    const buf = await renderPdfToBuffer(doc);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run tests/pdf-base.test.ts`
Expected: FAIL (no existen `@/lib/pdf/fonts` ni `@/lib/pdf/brand`).

- [ ] **Step 3: Crear `lib/pdf/brand.ts`**

```ts
export const brand = {
  red: "#D32F2F",
  redTintTotal: "#FBE9E9",
  gray: "#9E9E9E",
  ink: "#171717",
  muted: "#6B6B6B",
  boxBg: "#F4F4F4",
  boxBorder: "#E5E5E5",
  hairline: "#EEEEEE",
  white: "#FFFFFF",
  font: "Outfit",
  page: {
    paddingX: 42,
    paddingTop: 40,
    paddingBottom: 96,
  },
} as const;
```

- [ ] **Step 4: Crear `lib/pdf/fonts.ts`**

```tsx
import path from "node:path";
import { Font } from "@react-pdf/renderer";

const dir = path.join(process.cwd(), "public", "fonts", "Outfit", "static");

Font.register({
  family: "Outfit",
  fonts: [
    { src: path.join(dir, "Outfit-Regular.ttf"), fontWeight: 400 },
    { src: path.join(dir, "Outfit-Medium.ttf"), fontWeight: 500 },
    { src: path.join(dir, "Outfit-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(dir, "Outfit-Bold.ttf"), fontWeight: 700 },
  ],
});

// Evita que react-pdf corte palabras con guiones a mitad de línea.
Font.registerHyphenationCallback((word) => [word]);
```

- [ ] **Step 5: Ejecutar el test y ver que pasa**

Run: `npx vitest run tests/pdf-base.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/pdf/brand.ts lib/pdf/fonts.ts tests/pdf-base.test.ts
git commit -m "feat(pdf): tokens de marca y registro de fuente Outfit"
```

---

### Task 2: `calcAge` en utils (Idade de la receita)

**Files:**
- Modify: `lib/pdf/utils.ts`
- Test: `tests/pdf-utils.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `calcAge(birthDate: Date | null | undefined, ref?: Date): number | null` desde `lib/pdf/utils.ts`. Devuelve la edad en años, o `null` si no hay `birthDate`. Se mantienen `formatDate` y `formatBRL` sin cambios.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/pdf-utils.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calcAge } from "@/lib/pdf/utils";

describe("calcAge", () => {
  const ref = new Date("2026-07-01T00:00:00Z");

  it("devuelve null sin fecha de nacimiento", () => {
    expect(calcAge(null, ref)).toBeNull();
    expect(calcAge(undefined, ref)).toBeNull();
  });

  it("calcula la edad ya cumplida", () => {
    expect(calcAge(new Date("1990-01-10T00:00:00Z"), ref)).toBe(36);
  });

  it("resta un año si el cumpleaños aún no llegó", () => {
    expect(calcAge(new Date("1990-12-31T00:00:00Z"), ref)).toBe(35);
  });
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run tests/pdf-utils.test.ts`
Expected: FAIL con "calcAge is not a function".

- [ ] **Step 3: Añadir `calcAge` a `lib/pdf/utils.ts`**

Añadir al final del archivo (sin tocar `formatDate`/`formatBRL`):

```ts
export function calcAge(birthDate: Date | null | undefined, ref: Date = new Date()): number | null {
  if (!birthDate) return null;
  let age = ref.getFullYear() - birthDate.getFullYear();
  const monthDiff = ref.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `npx vitest run tests/pdf-utils.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/utils.ts tests/pdf-utils.test.ts
git commit -m "feat(pdf): calcAge para la Idade de la receita"
```

---

### Task 3: Iconos SVG (`icons.tsx`)

**Files:**
- Create: `lib/pdf/icons.tsx`
- Test: `tests/pdf-icons.test.ts`

**Interfaces:**
- Consumes: `brand` de `lib/pdf/brand.ts`.
- Produces (todos con firma `({ size?: number; color?: string }) => JSX.Element`, `size` por defecto 12, `color` por defecto `brand.gray`): `IconUser`, `IconPhone`, `IconIdCard`, `IconFolder`, `IconCalendar`, `IconCreditCard`, `IconChat`, `IconPin`, `IconGlobe`, `IconTooth`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/pdf-icons.test.ts`:

```tsx
import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { Document, Page, View } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import * as Icons from "@/lib/pdf/icons";

describe("pdf icons", () => {
  it("renderiza todos los iconos sin error (paths SVG válidos)", async () => {
    const all = Object.values(Icons).map((Icon, i) => h(Icon as any, { key: i, size: 14 }));
    const doc = h(Document, null, h(Page, { size: "A4" }, h(View, null, ...all)));
    const buf = await renderPdfToBuffer(doc);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("exporta los 10 iconos esperados", () => {
    for (const name of [
      "IconUser", "IconPhone", "IconIdCard", "IconFolder", "IconCalendar",
      "IconCreditCard", "IconChat", "IconPin", "IconGlobe", "IconTooth",
    ]) {
      expect(typeof (Icons as any)[name]).toBe("function");
    }
  });
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run tests/pdf-icons.test.ts`
Expected: FAIL (no existe `@/lib/pdf/icons`).

- [ ] **Step 3: Crear `lib/pdf/icons.tsx`**

Iconos de línea 24×24 (stroke, sin relleno), compuestos con primitivas de `@react-pdf`:

```tsx
import { Svg, Path, Circle, Rect, Line } from "@react-pdf/renderer";
import { brand } from "./brand";

type IconProps = { size?: number; color?: string };

const STROKE = 1.7;
function stroke(color: string) {
  return {
    stroke: color,
    strokeWidth: STROKE,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}
function wrap(size: number, children: React.ReactNode) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      {children}
    </Svg>
  );
}

export function IconUser({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Circle cx={12} cy={8} r={4} {...s} />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" {...s} />
    </>
  ));
}

export function IconPhone({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M5 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" {...s} />
  ));
}

export function IconIdCard({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Rect x={2.5} y={5} width={19} height={14} rx={2} {...s} />
      <Circle cx={8} cy={11} r={2.2} {...s} />
      <Path d="M4.6 16c.5-1.9 2-2.6 3.4-2.6s2.9.7 3.4 2.6" {...s} />
      <Line x1={14} y1={10} x2={19} y2={10} {...s} />
      <Line x1={14} y1={13} x2={19} y2={13} {...s} />
    </>
  ));
}

export function IconFolder({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M3 6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" {...s} />
  ));
}

export function IconCalendar({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={2} {...s} />
      <Line x1={3.5} y1={9} x2={20.5} y2={9} {...s} />
      <Line x1={8} y1={3} x2={8} y2={6} {...s} />
      <Line x1={16} y1={3} x2={16} y2={6} {...s} />
    </>
  ));
}

export function IconCreditCard({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Rect x={2.5} y={5} width={19} height={14} rx={2} {...s} />
      <Line x1={2.5} y1={9.5} x2={21.5} y2={9.5} {...s} />
    </>
  ));
}

export function IconChat({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" {...s} />
  ));
}

export function IconPin({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11z" {...s} />
      <Circle cx={12} cy={10} r={2.5} {...s} />
    </>
  ));
}

export function IconGlobe({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <>
      <Circle cx={12} cy={12} r={9} {...s} />
      <Line x1={3} y1={12} x2={21} y2={12} {...s} />
      <Path d="M12 3c3 3.5 3 14.5 0 18c-3-3.5-3-14.5 0-18z" {...s} />
    </>
  ));
}

export function IconTooth({ size = 12, color = brand.gray }: IconProps) {
  const s = stroke(color);
  return wrap(size, (
    <Path d="M7 3C5 3 3.6 4.6 3.6 7c0 2 .8 3 1.2 5 .5 2.6.3 8 1.8 8 1.3 0 1-3 2.5-3s1.2 3 2.5 3c1.5 0 1.3-5.4 1.8-8 .4-2 1.2-3 1.2-5C15 4.6 13.5 3 11.5 3c-1.7 0-2.3 1-3.5 1S8.7 3 7 3z" {...s} />
  ));
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `npx vitest run tests/pdf-icons.test.ts`
Expected: PASS (2 tests). Si algún `d`/atributo fuese inválido, el render lanzaría y el test fallaría.

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/icons.tsx tests/pdf-icons.test.ts
git commit -m "feat(pdf): set de iconos SVG de línea"
```

---

### Task 4: Piezas compartidas (header, patient-box, signature-box, footer)

**Files:**
- Create: `lib/pdf/header.tsx`
- Create: `lib/pdf/patient-box.tsx`
- Create: `lib/pdf/signature-box.tsx`
- Create: `lib/pdf/footer.tsx`
- Test: `tests/pdf-chrome.test.tsx`

No se borra `lib/pdf/shared.tsx` ni `lib/pdf/styles.ts` todavía (los documentos antiguos aún los importan; se eliminan en la Task 8).

**Interfaces:**
- Consumes: `brand`, iconos de `lib/pdf/icons`, tipo `ClinicProfile` de `@prisma/client`.
- Produces:
  - `PdfHeader({ title, lines }: { title: string; lines?: { label: string; value: string }[] })` — logo a la izquierda + título rojo y líneas de meta a la derecha.
  - `PatientBox({ fields }: { fields: { icon: React.ReactNode; label: string; value: string }[] })` — caja gris redondeada con filas icono+label+valor.
  - `SignatureBox({ clinic }: { clinic: ClinicProfile })` — caja gris con diente-en-círculo + nombre/especialidad/CRO + línea de firma.
  - `PdfFooter({ clinic, tagline }: { clinic: ClinicProfile; tagline?: string })` — barra roja + contacto + tagline; `fixed`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/pdf-chrome.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { Document, Page } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { PdfHeader } from "@/lib/pdf/header";
import { PatientBox } from "@/lib/pdf/patient-box";
import { SignatureBox } from "@/lib/pdf/signature-box";
import { PdfFooter } from "@/lib/pdf/footer";
import { IconUser } from "@/lib/pdf/icons";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123 - Centro", cityLine: "Fortaleza - CE - CEP 60000-000",
  website: "www.darcymavignier.com.br", createdAt: new Date(), updatedAt: new Date(),
} as any;

describe("pdf chrome", () => {
  it("renderiza header + patient box + signature + footer", async () => {
    const doc = h(
      Document, null,
      h(Page, { size: "A4", style: { paddingBottom: 96 } },
        h(PdfHeader, { title: "ORÇAMENTO ODONTOLÓGICO", lines: [{ label: "Data:", value: "01/07/2026" }] }),
        h(PatientBox, { fields: [{ icon: h(IconUser, {}), label: "Paciente:", value: "Maria" }] }),
        h(SignatureBox, { clinic }),
        h(PdfFooter, { clinic, tagline: "PLANEJAMENTO CLARO PARA O SEU TRATAMENTO" }),
      ),
    );
    const buf = await renderPdfToBuffer(doc);
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run tests/pdf-chrome.test.tsx`
Expected: FAIL (no existen los módulos header/patient-box/signature-box/footer).

- [ ] **Step 3: Crear `lib/pdf/header.tsx`**

```tsx
import path from "node:path";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { brand } from "./brand";

const logoPath = path.join(process.cwd(), "public", "logo", "logoDarcy.png");

export function PdfHeader({
  title,
  lines = [],
}: {
  title: string;
  lines?: { label: string; value: string }[];
}) {
  return (
    <View style={s.header}>
      <Image src={logoPath} style={s.logo} />
      <View style={s.right}>
        <Text style={s.title}>{title}</Text>
        {lines.map((l) => (
          <Text key={l.label} style={s.metaLine}>
            <Text style={s.metaLabel}>{l.label} </Text>
            {l.value}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  logo: { width: 210, height: 75, objectFit: "contain" },
  right: { alignItems: "flex-end" },
  title: {
    fontFamily: brand.font,
    fontWeight: 700,
    fontSize: 17,
    color: brand.red,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  metaLine: { fontFamily: brand.font, fontSize: 10, color: brand.ink, marginTop: 3 },
  metaLabel: { color: brand.muted },
});
```

- [ ] **Step 4: Crear `lib/pdf/patient-box.tsx`**

```tsx
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { brand } from "./brand";

export type PatientField = { icon: React.ReactNode; label: string; value: string };

export function PatientBox({ fields }: { fields: PatientField[] }) {
  return (
    <View style={s.box}>
      {fields.map((f) => (
        <View key={f.label} style={s.row}>
          <View style={s.icon}>{f.icon}</View>
          <Text style={s.label}>{f.label}</Text>
          <Text style={s.value}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: brand.boxBg, borderRadius: 10, padding: 14, marginBottom: 18 },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  icon: { width: 16, marginRight: 8 },
  label: { fontFamily: brand.font, fontSize: 10.5, color: brand.muted, marginRight: 6 },
  value: { fontFamily: brand.font, fontSize: 10.5, color: brand.ink, fontWeight: 500 },
});
```

- [ ] **Step 5: Crear `lib/pdf/signature-box.tsx`**

```tsx
import type { ClinicProfile } from "@prisma/client";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { brand } from "./brand";
import { IconTooth } from "./icons";

export function SignatureBox({ clinic }: { clinic: ClinicProfile }) {
  return (
    <View style={s.box}>
      <View style={s.top}>
        <View style={s.toothCircle}>
          <IconTooth size={18} color={brand.red} />
        </View>
        <View>
          <Text style={s.name}>{clinic.name}</Text>
          <Text style={s.line}>{clinic.specialty}</Text>
          <Text style={s.line}>{clinic.cro}</Text>
        </View>
      </View>
      <View style={s.sigLine} />
      <Text style={s.assinatura}>Assinatura</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    width: 230,
    alignSelf: "flex-end",
    backgroundColor: brand.boxBg,
    borderRadius: 10,
    padding: 16,
  },
  top: { flexDirection: "row", alignItems: "center", marginBottom: 22 },
  toothCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: brand.red,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  name: { fontFamily: brand.font, fontWeight: 700, fontSize: 12, color: brand.red },
  line: { fontFamily: brand.font, fontSize: 10, color: brand.ink, marginTop: 2 },
  sigLine: { borderTopWidth: 1, borderTopColor: brand.ink, marginTop: 6 },
  assinatura: { fontFamily: brand.font, fontSize: 10, color: brand.muted, textAlign: "center", marginTop: 4 },
});
```

- [ ] **Step 6: Crear `lib/pdf/footer.tsx`**

```tsx
import type { ClinicProfile } from "@prisma/client";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { brand } from "./brand";
import { IconGlobe, IconPhone, IconPin } from "./icons";

export function PdfFooter({ clinic, tagline }: { clinic: ClinicProfile; tagline?: string }) {
  return (
    <View style={s.footer} fixed>
      <View style={s.bar} />
      <View style={s.cols}>
        <View style={s.col}>
          <IconPhone size={11} color={brand.red} />
          <Text style={s.text}>{clinic.phone}</Text>
        </View>
        <View style={s.col}>
          <IconPin size={11} color={brand.red} />
          <Text style={s.text}>
            {clinic.address} · {clinic.cityLine}
          </Text>
        </View>
        <View style={s.col}>
          <IconGlobe size={11} color={brand.red} />
          <Text style={s.text}>{clinic.website}</Text>
        </View>
      </View>
      {tagline ? <Text style={s.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  footer: { position: "absolute", left: brand.page.paddingX, right: brand.page.paddingX, bottom: 24 },
  bar: { borderTopWidth: 1, borderTopColor: brand.red, marginBottom: 8 },
  cols: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  col: { flexDirection: "row", alignItems: "center", gap: 5, maxWidth: "40%" },
  text: { fontFamily: brand.font, fontSize: 8, color: brand.ink },
  tagline: {
    fontFamily: brand.font,
    fontSize: 8.5,
    color: brand.red,
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 8,
  },
});
```

- [ ] **Step 7: Ejecutar el test y ver que pasa**

Run: `npx vitest run tests/pdf-chrome.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add lib/pdf/header.tsx lib/pdf/patient-box.tsx lib/pdf/signature-box.tsx lib/pdf/footer.tsx tests/pdf-chrome.test.tsx
git commit -m "feat(pdf): piezas compartidas header/patient-box/signature-box/footer"
```

---

### Task 5: Documento Orçamento

**Files:**
- Modify (reescritura completa): `lib/pdf/quote-document.tsx`
- Test: `tests/pdf-quote.test.tsx`

**Interfaces:**
- Consumes: `PdfHeader`, `PatientBox`, `SignatureBox`, `PdfFooter`, iconos, `brand`, `formatBRL`/`formatDate`, `import "@/lib/pdf/fonts"`.
- Produces:
  - `computeQuoteTotals(lines: { totalPriceCents: number }[], discountCents: number): { subtotal: number; total: number }`.
  - `QuoteDocument({ clinic, quote }: { clinic: ClinicProfile; quote: Quote & { patient: Patient; lines: QuoteLine[] } })`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/pdf-quote.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { QuoteDocument, computeQuoteTotals } from "@/lib/pdf/quote-document";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123", cityLine: "Fortaleza - CE", website: "www.darcymavignier.com.br",
  createdAt: new Date(), updatedAt: new Date(),
} as any;

function quoteWith(nLines: number) {
  return {
    id: "q1", patientId: "p1", number: "000123", issueDate: new Date("2026-07-01"),
    paymentMethod: "Cartão", validityDays: 30, discountCents: 5000, notes: "Sem observações",
    createdAt: new Date(), updatedAt: new Date(),
    patient: { name: "Maria Silva", phone: "(85) 98888-7777", cpf: "123.456.789-00", recordNumber: "A-12" },
    lines: Array.from({ length: nLines }, (_, i) => ({
      id: `l${i}`, quoteId: "q1", catalogItemId: null,
      description: `Procedimento ${i + 1}`, quantity: 1, unitPriceCents: 10000, totalPriceCents: 10000,
    })),
  } as any;
}

describe("QuoteDocument", () => {
  it("computeQuoteTotals resta el descuento", () => {
    expect(computeQuoteTotals([{ totalPriceCents: 10000 }, { totalPriceCents: 5000 }], 3000))
      .toEqual({ subtotal: 15000, total: 12000 });
  });

  it("renderiza con 1 línea", async () => {
    const buf = await renderPdfToBuffer(h(QuoteDocument, { clinic, quote: quoteWith(1) }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renderiza y pagina con 15 líneas", async () => {
    const buf = await renderPdfToBuffer(h(QuoteDocument, { clinic, quote: quoteWith(15) }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(1000);
  });
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run tests/pdf-quote.test.tsx`
Expected: FAIL con "computeQuoteTotals is not a function" (aún no existe en el módulo reescrito).

- [ ] **Step 3: Reescribir `lib/pdf/quote-document.tsx`**

```tsx
import type { ClinicProfile, Patient, Quote, QuoteLine } from "@prisma/client";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { brand } from "./brand";
import { formatBRL, formatDate } from "./utils";
import { PdfHeader } from "./header";
import { PatientBox } from "./patient-box";
import { SignatureBox } from "./signature-box";
import { PdfFooter } from "./footer";
import { IconChat, IconCalendar, IconCreditCard, IconFolder, IconIdCard, IconPhone, IconUser } from "./icons";

export function computeQuoteTotals(lines: { totalPriceCents: number }[], discountCents: number) {
  const subtotal = lines.reduce((sum, l) => sum + l.totalPriceCents, 0);
  return { subtotal, total: subtotal - discountCents };
}

export function QuoteDocument({
  clinic,
  quote,
}: {
  clinic: ClinicProfile;
  quote: Quote & { patient: Patient; lines: QuoteLine[] };
}) {
  const { subtotal, total } = computeQuoteTotals(quote.lines, quote.discountCents);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title="ORÇAMENTO ODONTOLÓGICO"
          lines={[
            { label: "Data:", value: formatDate(quote.issueDate) },
            { label: "Nº do orçamento:", value: quote.number },
          ]}
        />

        <PatientBox
          fields={[
            { icon: <IconUser />, label: "Paciente:", value: quote.patient.name },
            { icon: <IconPhone />, label: "Telefone:", value: quote.patient.phone },
            { icon: <IconIdCard />, label: "CPF:", value: quote.patient.cpf ?? "—" },
            { icon: <IconFolder />, label: "Prontuário:", value: quote.patient.recordNumber ?? "—" },
          ]}
        />

        {/* Tabla */}
        <View style={s.thead}>
          <Text style={[s.th, s.colItem]}>Item</Text>
          <Text style={[s.th, s.colDesc]}>Descrição</Text>
          <Text style={[s.th, s.colQtd]}>Qtd.</Text>
          <Text style={[s.th, s.colUnit]}>Valor unit.</Text>
          <Text style={[s.th, s.colTotal]}>Valor total</Text>
        </View>
        {quote.lines.map((line, i) => (
          <View key={line.id} style={s.trow} wrap={false}>
            <View style={s.colItem}>
              <View style={s.numCircle}>
                <Text style={s.num}>{i + 1}</Text>
              </View>
            </View>
            <Text style={[s.td, s.colDesc]}>{line.description}</Text>
            <Text style={[s.td, s.colQtd]}>{line.quantity}</Text>
            <Text style={[s.td, s.colUnit]}>{formatBRL(line.unitPriceCents)}</Text>
            <Text style={[s.td, s.colTotal]}>{formatBRL(line.totalPriceCents)}</Text>
          </View>
        ))}

        {/* Totales */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{formatBRL(subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Desconto</Text>
            <Text style={s.totalValue}>{formatBRL(quote.discountCents)}</Text>
          </View>
          <View style={[s.totalRow, s.totalHighlight]}>
            <Text style={[s.totalLabel, s.totalStrong]}>Total</Text>
            <Text style={[s.totalValue, s.totalStrong]}>{formatBRL(total)}</Text>
          </View>
        </View>

        {/* Pie: pagos/observaciones + firma */}
        <View style={s.bottom}>
          <View style={s.bottomLeft}>
            <View style={s.metaRow}>
              <IconCreditCard color={brand.red} />
              <Text style={s.metaText}>Forma de pagamento: {quote.paymentMethod ?? "—"}</Text>
            </View>
            <View style={s.metaRow}>
              <IconCalendar color={brand.red} />
              <Text style={s.metaText}>Validade do orçamento: {quote.validityDays ?? "—"} dias</Text>
            </View>
            <View style={s.metaRow}>
              <IconChat color={brand.red} />
              <Text style={s.metaText}>Observações: {quote.notes ?? "—"}</Text>
            </View>
          </View>
          <SignatureBox clinic={clinic} />
        </View>

        <PdfFooter clinic={clinic} tagline="PLANEJAMENTO CLARO PARA O SEU TRATAMENTO" />
      </Page>
    </Document>
  );
}

const s = StyleSheet.create({
  page: {
    paddingHorizontal: brand.page.paddingX,
    paddingTop: brand.page.paddingTop,
    paddingBottom: brand.page.paddingBottom,
    fontFamily: brand.font,
    color: brand.ink,
    fontSize: 10.5,
  },
  thead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: brand.red, paddingBottom: 6 },
  th: { fontFamily: brand.font, fontWeight: 700, fontSize: 10, color: brand.red },
  trow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: brand.hairline, paddingVertical: 7 },
  td: { fontFamily: brand.font, fontSize: 10 },
  colItem: { width: "10%", alignItems: "center" },
  colDesc: { width: "44%" },
  colQtd: { width: "12%", textAlign: "center" },
  colUnit: { width: "17%", textAlign: "right" },
  colTotal: { width: "17%", textAlign: "right" },
  numCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: brand.red, alignItems: "center", justifyContent: "center" },
  num: { fontFamily: brand.font, fontSize: 9, color: brand.red },
  totals: { width: 250, alignSelf: "flex-end", marginTop: 14, borderWidth: 1, borderColor: brand.boxBorder, borderRadius: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: brand.boxBorder },
  totalHighlight: { backgroundColor: brand.redTintTotal, borderBottomWidth: 0 },
  totalLabel: { fontFamily: brand.font, fontSize: 11 },
  totalValue: { fontFamily: brand.font, fontSize: 11 },
  totalStrong: { fontWeight: 700, color: brand.red },
  bottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  bottomLeft: { width: 260 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  metaText: { fontFamily: brand.font, fontSize: 10, color: brand.ink, flex: 1 },
});
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `npx vitest run tests/pdf-quote.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/quote-document.tsx tests/pdf-quote.test.tsx
git commit -m "feat(pdf): documento de orçamento con fidelidad de marca"
```

---

### Task 6: Documento Receita

**Files:**
- Modify (reescritura completa): `lib/pdf/prescription-document.tsx`
- Test: `tests/pdf-prescription.test.tsx`

**Interfaces:**
- Consumes: `PdfHeader`, `PatientBox`, `SignatureBox`, `PdfFooter`, iconos, `brand`, `formatDate`, `calcAge`, `import "@/lib/pdf/fonts"`.
- Produces: `PrescriptionDocument({ clinic, prescription }: { clinic: ClinicProfile; prescription: Prescription & { patient: Patient; items: PrescriptionItem[] } })`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/pdf-prescription.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { PrescriptionDocument } from "@/lib/pdf/prescription-document";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123", cityLine: "Fortaleza - CE", website: "www.darcymavignier.com.br",
  createdAt: new Date(), updatedAt: new Date(),
} as any;

const prescription = {
  id: "r1", patientId: "p1", issueDate: new Date("2026-07-01"), notes: "Retorno em 7 dias",
  createdAt: new Date(), updatedAt: new Date(),
  patient: { name: "João Souza", birthDate: new Date("1990-01-10"), recordNumber: "B-9" },
  items: [
    { id: "i1", prescriptionId: "r1", medicine: "Amoxicilina 500mg", instructions: "Tomar 1 cápsula de 8/8h, por 7 dias.", position: 0 },
    { id: "i2", prescriptionId: "r1", medicine: "Nimesulida 100mg", instructions: "Tomar 1 comprimido de 12/12h, por 3 dias.", position: 1 },
  ],
} as any;

describe("PrescriptionDocument", () => {
  it("renderiza una receita con varios ítems", async () => {
    const buf = await renderPdfToBuffer(h(PrescriptionDocument, { clinic, prescription }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renderiza sin fecha de nacimiento (Idade —)", async () => {
    const p = { ...prescription, patient: { ...prescription.patient, birthDate: null } };
    const buf = await renderPdfToBuffer(h(PrescriptionDocument, { clinic, prescription: p }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run tests/pdf-prescription.test.tsx`
Expected: FAIL (el módulo reescrito aún no existe con el nuevo layout; el import puede resolver pero el render usará piezas nuevas — asegurar el fallo escribiendo primero el test y viendo el error de render/estructura). Si pasara por casualidad con el código viejo, continuar igualmente con la reescritura.

- [ ] **Step 3: Reescribir `lib/pdf/prescription-document.tsx`**

```tsx
import type { ClinicProfile, Patient, Prescription, PrescriptionItem } from "@prisma/client";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { brand } from "./brand";
import { calcAge, formatDate } from "./utils";
import { PdfHeader } from "./header";
import { PatientBox } from "./patient-box";
import { SignatureBox } from "./signature-box";
import { PdfFooter } from "./footer";
import { IconCalendar, IconFolder, IconUser } from "./icons";

export function PrescriptionDocument({
  clinic,
  prescription,
}: {
  clinic: ClinicProfile;
  prescription: Prescription & { patient: Patient; items: PrescriptionItem[] };
}) {
  const age = calcAge(prescription.patient.birthDate);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title="RECEITA ODONTOLÓGICA"
          lines={[{ label: "Data:", value: formatDate(prescription.issueDate) }]}
        />

        <PatientBox
          fields={[
            { icon: <IconUser />, label: "Paciente:", value: prescription.patient.name },
            { icon: <IconCalendar />, label: "Idade:", value: age !== null ? `${age} anos` : "—" },
            { icon: <IconFolder />, label: "Prontuário:", value: prescription.patient.recordNumber ?? "—" },
          ]}
        />

        <View style={s.rxRow}>
          <Text style={s.rxMark}>℞</Text>
          <Text style={s.rxTitle}>Prescrevo:</Text>
        </View>

        {prescription.items.map((item, i) => (
          <View key={item.id} style={s.item} wrap={false}>
            <View style={s.numCircle}>
              <Text style={s.num}>{i + 1}</Text>
            </View>
            <View style={s.itemBody}>
              <Text style={s.medicine}>{item.medicine}</Text>
              <Text style={s.instructions}>{item.instructions}</Text>
            </View>
          </View>
        ))}

        <View style={s.bottom}>
          <View style={s.obs}>
            <View style={s.obsSep} />
            <Text style={s.obsLabel}>Observações:</Text>
            <Text style={s.obsText}>{prescription.notes ?? "—"}</Text>
          </View>
          <SignatureBox clinic={clinic} />
        </View>

        <PdfFooter clinic={clinic} tagline="CUIDAR DO SEU SORRISO É A NOSSA MISSÃO" />
      </Page>
    </Document>
  );
}

const s = StyleSheet.create({
  page: {
    paddingHorizontal: brand.page.paddingX,
    paddingTop: brand.page.paddingTop,
    paddingBottom: brand.page.paddingBottom,
    fontFamily: brand.font,
    color: brand.ink,
    fontSize: 10.5,
  },
  rxRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  rxMark: { fontFamily: "Times-Roman", fontSize: 26, color: brand.red },
  rxTitle: { fontFamily: brand.font, fontWeight: 700, fontSize: 14, color: brand.red },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  numCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: brand.red, alignItems: "center", justifyContent: "center", marginTop: 1 },
  num: { fontFamily: brand.font, fontSize: 9, color: brand.red },
  itemBody: { flex: 1 },
  medicine: { fontFamily: brand.font, fontWeight: 700, fontSize: 11.5, color: brand.ink },
  instructions: { fontFamily: brand.font, fontSize: 10.5, color: brand.ink, marginTop: 2, lineHeight: 1.4 },
  bottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 20 },
  obs: { width: 260 },
  obsSep: { borderTopWidth: 1, borderTopColor: brand.red, marginBottom: 8 },
  obsLabel: { fontFamily: brand.font, fontWeight: 500, fontSize: 10, color: brand.red, marginBottom: 4 },
  obsText: { fontFamily: brand.font, fontSize: 10, color: brand.ink, lineHeight: 1.4 },
});
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `npx vitest run tests/pdf-prescription.test.tsx`
Expected: PASS (2 tests). Si el glifo `℞` no se dibujase con Times-Roman, sustituir `rxMark` por una composición `R` grande + `x` pequeño en `Times-Roman` (ambos `color: brand.red`); el test de render seguirá pasando.

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/prescription-document.tsx tests/pdf-prescription.test.tsx
git commit -m "feat(pdf): documento de receita con fidelidad de marca"
```

---

### Task 7: Documento Atestado

**Files:**
- Modify (reescritura completa): `lib/pdf/certificate-document.tsx`
- Test: `tests/pdf-certificate.test.tsx`

**Interfaces:**
- Consumes: `PdfHeader`, `PatientBox`, `SignatureBox`, `PdfFooter`, iconos, `brand`, `formatDate`, `import "@/lib/pdf/fonts"`.
- Produces: `CertificateDocument({ clinic, certificate }: { clinic: ClinicProfile; certificate: MedicalCertificate & { patient: Patient } })`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/pdf-certificate.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderPdfToBuffer } from "@/lib/pdf/render";
import { CertificateDocument } from "@/lib/pdf/certificate-document";

const clinic = {
  id: "default", name: "Dr. Darcy Mavignier", subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista", cro: "CRO-CE 4157", phone: "(85) 99999-9999",
  address: "Rua das Flores, 123", cityLine: "Fortaleza - CE", website: "www.darcymavignier.com.br",
  createdAt: new Date(), updatedAt: new Date(),
} as any;

const certificate = {
  id: "c1", patientId: "p1", issueDate: new Date("2026-07-01"),
  absenceStartDate: new Date("2026-07-01"), absenceEndDate: new Date("2026-07-03"),
  cid: "K04.7", city: "Fortaleza", notes: null, createdAt: new Date(), updatedAt: new Date(),
  patient: { name: "Ana Lima", cpf: "111.222.333-44", recordNumber: "C-3" },
} as any;

describe("CertificateDocument", () => {
  it("renderiza un atestado", async () => {
    const buf = await renderPdfToBuffer(h(CertificateDocument, { clinic, certificate }));
    expect(buf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `npx vitest run tests/pdf-certificate.test.tsx`
Expected: FAIL o render con layout viejo. Continuar con la reescritura.

- [ ] **Step 3: Reescribir `lib/pdf/certificate-document.tsx`**

```tsx
import type { ClinicProfile, MedicalCertificate, Patient } from "@prisma/client";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import { brand } from "./brand";
import { formatDate } from "./utils";
import { PdfHeader } from "./header";
import { PatientBox } from "./patient-box";
import { SignatureBox } from "./signature-box";
import { PdfFooter } from "./footer";
import { IconFolder, IconIdCard, IconUser } from "./icons";

export function CertificateDocument({
  clinic,
  certificate,
}: {
  clinic: ClinicProfile;
  certificate: MedicalCertificate & { patient: Patient };
}) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PdfHeader
          title="ATESTADO ODONTOLÓGICO"
          lines={[{ label: "Data:", value: formatDate(certificate.issueDate) }]}
        />

        <PatientBox
          fields={[
            { icon: <IconUser />, label: "Paciente:", value: certificate.patient.name },
            { icon: <IconIdCard />, label: "CPF:", value: certificate.patient.cpf ?? "—" },
            { icon: <IconFolder />, label: "Prontuário:", value: certificate.patient.recordNumber ?? "—" },
          ]}
        />

        <View style={s.body}>
          <Text style={s.paragraph}>
            Atesto, para os devidos fins, que o(a) Sr(a). {certificate.patient.name} esteve sob meus
            cuidados odontológicos e deverá afastar-se de suas atividades laborais no período de{" "}
            {formatDate(certificate.absenceStartDate)} a {formatDate(certificate.absenceEndDate)}.
          </Text>
          <Text style={s.cid}>CID: {certificate.cid}</Text>
          {certificate.notes ? <Text style={s.notes}>{certificate.notes}</Text> : null}
          <Text style={s.place}>
            {certificate.city}, {formatDate(certificate.issueDate)}.
          </Text>
        </View>

        <View style={s.signWrap}>
          <SignatureBox clinic={clinic} />
        </View>

        <PdfFooter clinic={clinic} />
      </Page>
    </Document>
  );
}

const s = StyleSheet.create({
  page: {
    paddingHorizontal: brand.page.paddingX,
    paddingTop: brand.page.paddingTop,
    paddingBottom: brand.page.paddingBottom,
    fontFamily: brand.font,
    color: brand.ink,
    fontSize: 11,
  },
  body: { marginTop: 28 },
  paragraph: { fontFamily: brand.font, fontSize: 12, lineHeight: 1.7, textAlign: "justify" },
  cid: { fontFamily: brand.font, fontWeight: 600, fontSize: 12, color: brand.red, marginTop: 22 },
  notes: { fontFamily: brand.font, fontSize: 11, color: brand.ink, marginTop: 12, lineHeight: 1.5 },
  place: { fontFamily: brand.font, fontSize: 12, marginTop: 28 },
  signWrap: { marginTop: 36 },
});
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `npx vitest run tests/pdf-certificate.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add lib/pdf/certificate-document.tsx tests/pdf-certificate.test.tsx
git commit -m "feat(pdf): documento de atestado con lenguaje de marca"
```

---

### Task 8: Limpieza de código huérfano + verificación completa

**Files:**
- Delete: `lib/pdf/shared.tsx`
- Delete: `lib/pdf/styles.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: nada nuevo. Elimina módulos ya sin uso.

- [ ] **Step 1: Confirmar que `shared.tsx` y `styles.ts` están huérfanos**

Run: `grep -rn "pdf/shared\|pdf/styles\|pdfStyles\|PdfHeader\b" lib app tests | grep -v "lib/pdf/header"`
Expected: sin resultados que importen `./shared`, `./styles`, `pdfStyles`, ni el antiguo `PdfHeader` de `shared`. (Los tres documentos ya importan de `header.tsx`/`footer.tsx`/`signature-box.tsx`.) Si aparece algún consumidor, corregir el import antes de borrar.

- [ ] **Step 2: Borrar los archivos huérfanos**

```bash
git rm lib/pdf/shared.tsx lib/pdf/styles.ts
```

- [ ] **Step 3: Ejecutar TODA la suite de tests**

Run: `pnpm test`
Expected: PASS, incluidos `pdf-base`, `pdf-utils`, `pdf-icons`, `pdf-chrome`, `pdf-quote`, `pdf-prescription`, `pdf-certificate`, y todos los previos sin romperse.

- [ ] **Step 4: Build de tipos**

Run: `pnpm build`
Expected: compila sin errores de TypeScript ni de importaciones rotas.

- [ ] **Step 5: Verificación visual manual contra las imágenes de referencia**

1. `pnpm dev`.
2. Con datos de seed (o creando un orçamento y una receita desde la app), abrir en el navegador:
   - `GET /api/pdf/orcamentos/<id>`
   - `GET /api/pdf/receitas/<id>`
   - `GET /api/pdf/atestados/<id>`
3. Comparar cada PDF con su imagen de referencia. Checklist:
   - Logo presente y nítido arriba a la izquierda; título rojo a la derecha; línea Data/Nº.
   - Caja gris de paciente con iconos alineados.
   - Orçamento: círculos rojos numerados correlativos, columnas alineadas, caja de totales con **Total** resaltado, bloque inferior (pagamento/validade/observações + firma).
   - Receita: símbolo ℞, ítems en negrita + instrucciones, separador rojo, firma.
   - Barra de pie roja con teléfono/dirección/web y tagline centrado, anclada al fondo.
4. Si algo no calza (tamaños, márgenes, pesos de fuente), ajustar los `StyleSheet` co-localizados y volver a comparar. Estos ajustes finos son esperables: las imágenes son la referencia de verdad.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(pdf): eliminar shared.tsx/styles.ts huérfanos tras la migración"
```

---

## Self-Review

**Cobertura del spec:**
- Motor `@react-pdf` → se mantiene (Tasks 1-7). ✓
- Logo solo imagen, sin duplicar subtítulo → `header.tsx` (Task 4). ✓
- Fuente Outfit 4 pesos desde `public/fonts/Outfit/static/` → `fonts.ts` (Task 1). ✓
- Iconos SVG (10) → `icons.tsx` (Task 3). ✓
- `brand.ts`, header, patient-box, signature-box, footer → Tasks 1 y 4. ✓
- Orçamento (tabla dinámica, círculos, totales, bloque inferior) → Task 5. ✓
- Receita (Idade calculada, ℞, lista numerada) → Tasks 2 y 6. ✓
- Atestado (mismo lenguaje) → Task 7. ✓
- Filas `wrap={false}`, sin relleno, footer `fixed` → Tasks 4-6. ✓
- Cabecera de columnas una vez (sin `fixed` a media página) → Task 5. ✓
- Eliminar `styles.ts`/`shared.tsx` huérfanos → Task 8. ✓
- Criterios de verificación (endpoints, 1 y 15 líneas, Idade, build) → tests de Tasks 5-7 + Task 8. ✓

**Placeholders:** ninguno; todo el código está escrito.

**Consistencia de tipos:** `computeQuoteTotals` mismo nombre en Task 5 y su test. Iconos con firma `({ size?, color? })` usados igual en chrome y documentos. `PatientBox`/`SignatureBox`/`PdfHeader`/`PdfFooter` con las firmas declaradas en Task 4 y consumidas igual en Tasks 5-7.
