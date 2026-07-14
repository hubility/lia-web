import fs from "node:fs";
import path from "node:path";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { brand } from "./brand";

// Buffer en vez de ruta: react-pdf interpreta "C:\..." como URL con protocolo "c:" y no carga el archivo.
const logoSrc = {
  data: fs.readFileSync(path.join(process.cwd(), "public", "logo", "logoDarcy.png")),
  format: "png" as const,
};

export function PdfHeader({
  title,
  lines = [],
}: {
  title: string;
  lines?: { label: string; value: string }[];
}) {
  return (
    <View style={s.header}>
      {/* Image de @react-pdf, no <img> HTML: un PDF no tiene atributo alt. */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src={logoSrc} style={s.logo} />
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
