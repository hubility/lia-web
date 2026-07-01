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
