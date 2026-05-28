import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ClinicProfile, Patient, Quote, QuoteLine } from "@/app/generated/prisma/client";
import { formatBRL, formatDate } from "@/lib/pdf/utils";
import { PdfFooter, PdfHeader, SignatureBox } from "./shared";
import { pdfStyles } from "./styles";

export function QuoteDocument({
  clinic,
  quote,
}: {
  clinic: ClinicProfile;
  quote: Quote & { patient: Patient; lines: QuoteLine[] };
}) {
  const subtotal = quote.lines.reduce((sum, line) => sum + line.totalPriceCents, 0);
  const total = subtotal - quote.discountCents;

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader clinic={clinic} title="ORÇAMENTO ODONTOLÓGICO" />
        <View style={pdfStyles.box}>
          <Text style={pdfStyles.text}>Data: {formatDate(quote.issueDate)} · Nº {quote.number}</Text>
          <Text style={pdfStyles.text}>Paciente: {quote.patient.name}</Text>
          <Text style={pdfStyles.text}>Telefone: {quote.patient.phone}</Text>
          <Text style={pdfStyles.text}>CPF: {quote.patient.cpf ?? "-"}</Text>
          <Text style={pdfStyles.text}>Prontuário: {quote.patient.recordNumber ?? "-"}</Text>
        </View>
        <View style={pdfStyles.tableHeader}>
          <Text style={{ width: "50%" }}>Descrição</Text>
          <Text style={{ width: "15%" }}>Qtd.</Text>
          <Text style={{ width: "18%" }}>Valor unit.</Text>
          <Text style={{ width: "17%" }}>Total</Text>
        </View>
        {quote.lines.map((line) => (
          <View key={line.id} style={pdfStyles.tableRow}>
            <Text style={{ width: "50%" }}>{line.description}</Text>
            <Text style={{ width: "15%" }}>{line.quantity}</Text>
            <Text style={{ width: "18%" }}>{formatBRL(line.unitPriceCents)}</Text>
            <Text style={{ width: "17%" }}>{formatBRL(line.totalPriceCents)}</Text>
          </View>
        ))}
        <View style={[pdfStyles.box, { width: 230, alignSelf: "flex-end", marginTop: 16 }]}>
          <Text style={pdfStyles.text}>Subtotal: {formatBRL(subtotal)}</Text>
          <Text style={pdfStyles.text}>Desconto: {formatBRL(quote.discountCents)}</Text>
          <Text style={[pdfStyles.text, { color: "#D32F2F", fontWeight: 700 }]}>Total: {formatBRL(total)}</Text>
        </View>
        <Text style={pdfStyles.text}>Forma de pagamento: {quote.paymentMethod ?? "-"}</Text>
        <Text style={pdfStyles.text}>Validade: {quote.validityDays ?? "-"} dias</Text>
        <Text style={pdfStyles.text}>Observações: {quote.notes ?? "-"}</Text>
        <SignatureBox clinic={clinic} />
        <PdfFooter clinic={clinic} mission="PLANEJAMENTO CLARO PARA O SEU TRATAMENTO" />
      </Page>
    </Document>
  );
}
