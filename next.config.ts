import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El cliente Prisma se genera en app/generated/prisma (output custom). Next le
  // hace tree-shaking al motor nativo .so.node y no lo copia a la funcion
  // serverless. Forzamos su inclusion en el trace de todas las rutas.
  outputFileTracingIncludes: {
    "/**": ["./app/generated/prisma/**/*"],
  },
};

export default nextConfig;
