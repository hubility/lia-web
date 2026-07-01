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
