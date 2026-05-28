import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    padding: 42,
    fontFamily: "Helvetica",
    color: "#171717",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  brand: {
    fontSize: 22,
    color: "#D32F2F",
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 12,
    color: "#777777",
  },
  title: {
    fontSize: 20,
    color: "#D32F2F",
    fontWeight: 700,
  },
  box: {
    border: "1 solid #E5E5E5",
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
  },
  label: {
    fontSize: 10,
    color: "#777777",
    marginBottom: 3,
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #D32F2F",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #EEEEEE",
    paddingVertical: 6,
  },
  footer: {
    position: "absolute",
    left: 42,
    right: 42,
    bottom: 28,
    borderTop: "1 solid #D32F2F",
    paddingTop: 10,
    fontSize: 9,
    color: "#555555",
    textAlign: "center",
  },
});
