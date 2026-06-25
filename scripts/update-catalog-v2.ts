// Actualiza el catálogo según Base_Treinamento_IA_Dr_Darcy_Mavignier_V2.docx
// (secciones 6 — tempos de agenda, 7 — consulta de avaliação, 9 — valores permitidos).
//
// Idempotente: matchea por nombre actual o nuevo, actualiza in-place (conserva ids
// con citas asociadas) y crea los que falten. Ejecutar con:
//   DATABASE_URL=... npx tsx scripts/update-catalog-v2.ts
//
// Criterios:
// - Rangos de precio: priceCents = mínimo del rango; el rango completo va en la
//   descripción (Lia la lee y contextualiza).
// - Procedimientos sin precio por chat (implante, coroa/prótese): priceCents = 0
//   y descripción "orçamento individualizado em consulta de avaliação".

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ItemSpec {
  /** Nombres con los que puede existir hoy (el primero es el nombre final). */
  names: string[];
  description: string;
  priceCents: number;
  durationMinutes: number;
  isActive?: boolean;
}

const items: ItemSpec[] = [
  {
    names: ["Consulta de avaliação", "Consulta odontológica"],
    description:
      "Avaliação completa do caso, orientação sobre o tratamento ideal e elaboração do orçamento detalhado. O valor é totalmente abatido do valor final caso o tratamento seja realizado na clínica no período de 30 dias.",
    priceCents: 25000,
    durationMinutes: 30,
  },
  {
    names: ["Limpeza", "Limpeza dental"],
    description:
      "De R$ 400 a R$ 500, conforme quantidade de manchas, placa e tártaro. Pode incluir ultrassom, polimento, escovação orientada, jato de bicarbonato e flúor.",
    priceCents: 40000,
    durationMinutes: 40,
  },
  {
    names: ["Restauração"],
    description:
      "De R$ 300 a R$ 500, conforme o tamanho da cavidade e a complexidade. Resinas premium importadas.",
    priceCents: 30000,
    durationMinutes: 60,
  },
  {
    names: ["Tratamento de canal", "Canal radicular"],
    description:
      "De R$ 900 a R$ 1.400; dentes posteriores costumam ter valor mais elevado. Técnica automatizada e microscopia.",
    priceCents: 90000,
    durationMinutes: 90,
  },
  {
    names: ["Extração simples"],
    description:
      "De R$ 400 a R$ 500, conforme o grau de dificuldade. A remoção dos pontos com 10 dias já está incluída.",
    priceCents: 40000,
    durationMinutes: 60,
  },
  {
    names: ["Remoção de siso"],
    description:
      "Conforme a posição: erupcionado R$ 500; semi-incluso R$ 600 a R$ 700; incluso (dentro do osso) R$ 750 a R$ 900. A avaliação clínica confirma a complexidade e, em alguns casos, é necessário exame de imagem.",
    priceCents: 50000,
    durationMinutes: 90,
  },
  {
    names: ["Remoção de pontos"],
    description: "Incluída nas extrações realizadas na clínica.",
    priceCents: 0,
    durationMinutes: 15,
  },
  {
    names: ["Prova de prótese"],
    description: "Etapa do tratamento protético em andamento na clínica.",
    priceCents: 0,
    durationMinutes: 60,
  },
  {
    names: ["Limpeza + clareamento (combo)"],
    description:
      "Combo por R$ 1.600. Técnica caseira supervisionada, geralmente 1 hora ao dia durante 10 dias, com controle de sensibilidade.",
    priceCents: 160000,
    durationMinutes: 60,
  },
  {
    names: ["Implante dentário"],
    description:
      "Orçamento individualizado em consulta de avaliação (marca do implante, quantidade de osso, enxerto, material da coroa e complexidade), preferencialmente com panorâmica ou tomografia.",
    priceCents: 0,
    durationMinutes: 90,
  },
  {
    names: ["Coroa protética"],
    description:
      "Orçamento individualizado em consulta de avaliação (material, número de dentes, pinos e preparos adicionais).",
    priceCents: 0,
    durationMinutes: 60,
  },
];

/** Ítems que dejan de ofrecerse (no se borran: pueden tener citas históricas). */
const deactivate: string[] = ["Clareamento dental"];

async function main() {
  for (const spec of items) {
    const [finalName] = spec.names;
    const existing = await prisma.catalogItem.findFirst({
      where: { name: { in: spec.names } },
    });
    const data = {
      name: finalName,
      description: spec.description,
      priceCents: spec.priceCents,
      durationMinutes: spec.durationMinutes,
      isActive: true,
    };
    if (existing) {
      await prisma.catalogItem.update({ where: { id: existing.id }, data });
      console.log(`UPDATE  ${existing.name} -> ${finalName} | R$ ${(spec.priceCents / 100).toFixed(2)} | ${spec.durationMinutes}min`);
    } else {
      await prisma.catalogItem.create({ data });
      console.log(`CREATE  ${finalName} | R$ ${(spec.priceCents / 100).toFixed(2)} | ${spec.durationMinutes}min`);
    }
  }

  for (const name of deactivate) {
    const result = await prisma.catalogItem.updateMany({
      where: { name, isActive: true },
      data: { isActive: false },
    });
    if (result.count > 0) console.log(`OFF     ${name}`);
  }

  console.log("\n--- Catálogo final (activos) ---");
  const all = await prisma.catalogItem.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  for (const i of all) {
    console.log(`${i.name} | R$ ${(i.priceCents / 100).toFixed(2)} | ${i.durationMinutes}min`);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
