import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDocsEnabled } from "@/lib/docs";

// Sirve el documento OpenAPI (YAML) que alimenta a Scalar. Solo en desarrollo.
export async function GET() {
  if (!isDocsEnabled()) return new Response("Not found", { status: 404 });

  const yaml = await readFile(join(process.cwd(), "docs/api/openapi.yaml"), "utf8");
  return new Response(yaml, {
    headers: { "Content-Type": "application/yaml; charset=utf-8" },
  });
}
