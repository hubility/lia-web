// La documentación de la API (spec OpenAPI + Scalar) solo se publica en
// desarrollo. En producción (incluidos los despliegues de Vercel) responde 404.
export function isDocsEnabled() {
  return process.env.NODE_ENV !== "production";
}
