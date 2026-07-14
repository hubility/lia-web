// Puebla el catálogo de CID con el capítulo odontológico del CID-10 (K00–K14),
// tomado de la tabla oficial del DATASUS (CID-10-SUBCATEGORIAS.CSV, convertida a
// UTF-8 y con el código punteado) en prisma/data/cid10-odonto.json.
//
// Idempotente y no destructivo: solo inserta los códigos que faltan. Una descripción
// corregida o un código desactivado por el doctor no se pisan nunca. Ejecutar con:
//   npx tsx scripts/seed-cid.ts

import { PrismaClient } from "@prisma/client";
import cid10Odonto from "../prisma/data/cid10-odonto.json";

const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.cidCode.createMany({
    data: cid10Odonto,
    skipDuplicates: true,
  });

  const total = await prisma.cidCode.count();
  console.log(`${count} códigos novos | ${total} no catálogo`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
