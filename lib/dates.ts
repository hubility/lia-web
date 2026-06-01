export function parseDate(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text ? new Date(`${text}T00:00:00`) : new Date();
}

export function parseDateTime(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text ? new Date(text) : new Date();
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
