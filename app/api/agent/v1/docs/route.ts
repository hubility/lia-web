import { ApiReference } from "@scalar/nextjs-api-reference";
import { isDocsEnabled } from "@/lib/docs";

// Página interactiva de Scalar, alimentada por el spec en /api/agent/v1/openapi.
// Solo en desarrollo; en producción responde 404.
const reference = ApiReference({ url: "/api/agent/v1/openapi" });

export function GET() {
  if (!isDocsEnabled()) return new Response("Not found", { status: 404 });
  return reference();
}
