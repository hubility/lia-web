export function textValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

export function requiredText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  if (!value) throw new Error(`Campo obrigatório: ${key}`);
  return value;
}

export function intValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}
