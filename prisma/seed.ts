import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/passwords";
import { createOpaqueToken, hashToken } from "../lib/auth/tokens";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);

    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }

    process.env[match[1]] = match[2].replace(/^"(.*)"$/, "$1");
  }
}

const prisma = new PrismaClient();

const catalogItems = [
  {
    name: "Consulta odontológica",
    description: "Avaliação clínica inicial.",
    priceCents: 15000,
    durationMinutes: 45,
  },
  {
    name: "Limpeza dental",
    description: "Profilaxia e orientação de higiene.",
    priceCents: 22000,
    durationMinutes: 60,
  },
  {
    name: "Clareamento dental",
    description: "Sessão de clareamento em consultório.",
    priceCents: 90000,
    durationMinutes: 90,
  },
  {
    name: "Restauração",
    description: "Restauração em resina composta.",
    priceCents: 28000,
    durationMinutes: 60,
  },
  {
    name: "Extração simples",
    description: "Extração dentária sem complexidade cirúrgica.",
    priceCents: 35000,
    durationMinutes: 60,
  },
  {
    name: "Canal radicular",
    description: "Tratamento endodôntico por sessão.",
    priceCents: 75000,
    durationMinutes: 90,
  },
  {
    name: "Implante dentário",
    description: "Instalação de implante, sem prótese.",
    priceCents: 250000,
    durationMinutes: 90,
  },
  {
    name: "Coroa protética",
    description: "Coroa unitária sobre dente ou implante.",
    priceCents: 180000,
    durationMinutes: 60,
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "lia@hubilityai.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "123456";
  const apiKey = createOpaqueToken();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      role: "admin",
      isActive: true,
    },
    create: {
      name: process.env.SEED_ADMIN_NAME ?? "Administrador",
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      role: "admin",
      isActive: true,
    },
  });

  await prisma.clinicProfile.upsert({
    where: { id: "default" },
    update: {
      name: process.env.CLINIC_NAME ?? "Dr. Darcy Mavignier",
      subtitle: process.env.CLINIC_SUBTITLE ?? "odontologia integrada",
      specialty: process.env.CLINIC_SPECIALTY ?? "Cirurgião-Dentista",
      cro: process.env.CLINIC_CRO ?? "CRO-CE 4157",
      phone: process.env.CLINIC_PHONE ?? "(00) 00000-0000",
      address: process.env.CLINIC_ADDRESS ?? "Rua das Flores, 123 - Centro",
      cityLine: process.env.CLINIC_CITY_LINE ?? "Cidade - UF - CEP 00000-000",
      website: process.env.CLINIC_WEBSITE ?? "www.darcymavignier.com.br",
    },
    create: {
      id: "default",
      name: process.env.CLINIC_NAME ?? "Dr. Darcy Mavignier",
      subtitle: process.env.CLINIC_SUBTITLE ?? "odontologia integrada",
      specialty: process.env.CLINIC_SPECIALTY ?? "Cirurgião-Dentista",
      cro: process.env.CLINIC_CRO ?? "CRO-CE 4157",
      phone: process.env.CLINIC_PHONE ?? "(00) 00000-0000",
      address: process.env.CLINIC_ADDRESS ?? "Rua das Flores, 123 - Centro",
      cityLine: process.env.CLINIC_CITY_LINE ?? "Cidade - UF - CEP 00000-000",
      website: process.env.CLINIC_WEBSITE ?? "www.darcymavignier.com.br",
    },
  });

  for (const item of catalogItems) {
    const existing = await prisma.catalogItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.catalogItem.update({
        where: { id: existing.id },
        data: { ...item, isActive: true },
      });
      continue;
    }

    await prisma.catalogItem.create({
      data: item,
    });
  }

  const apiKeyName = process.env.SEED_API_KEY_NAME ?? "lia-agent-local";
  const existingApiKey = await prisma.apiKey.findFirst({
    where: { name: apiKeyName },
  });

  if (!existingApiKey) {
    await prisma.apiKey.create({
      data: {
        name: apiKeyName,
        keyHash: hashToken(apiKey),
        isActive: true,
      },
    });
    console.log(`Seed API key: ${apiKey}`);
  }

  console.log(`Seed admin email: ${adminEmail}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
