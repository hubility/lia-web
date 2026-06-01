// Genera una API key para el agente y guarda solo su hash en la BD.
// El token en claro se muestra UNA vez por consola: cópialo, no se puede
// recuperar después (en la tabla solo queda el SHA-256).
//
// Uso:
//   npx tsx scripts/create-api-key.ts "nombre-de-la-key"
//   (si no pasas nombre, usa "agent-key")

import "dotenv/config"; // carga DATABASE_URL del .env (tsx no lo hace solo)
import { prisma } from "@/lib/db/prisma";
import { createOpaqueToken, hashToken } from "@/lib/auth/tokens";

async function main() {
  const name = process.argv[2] ?? "agent-key";
  const token = createOpaqueToken();

  await prisma.apiKey.create({
    data: { name, keyHash: hashToken(token), isActive: true },
  });

  console.log("");
  console.log(`API key creada: "${name}"`);
  console.log(`x-api-key: ${token}`);
  console.log("");
  console.log("Guárdala ahora — no se puede recuperar después.");
}

main()
  .catch((err) => {
    console.error("Erro ao criar API key:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
