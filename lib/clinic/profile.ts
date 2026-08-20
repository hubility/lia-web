import { prisma } from "@/lib/db/prisma";

export async function getClinicProfile() {
  const profile = await prisma.clinicProfile.findUnique({ where: { id: "default" } });
  if (profile) return profile;
  return {
    id: "default",
    name: "Dr. Darcy Mavignier",
    subtitle: "odontologia integrada",
    specialty: "Cirurgião-Dentista",
    cro: "CRO-CE 4157",
    phone: "(00) 00000-0000",
    address: "Rua das Flores, 123 - Centro",
    cityLine: "Cidade - UF - CEP 00000-000",
    website: "www.darcymavignier.com.br",
    opensAtMinutes: 8 * 60,
    closesAtMinutes: 19 * 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export type ClinicProfileInput = {
  name: string;
  specialty: string;
  cro: string;
  phone: string;
  address: string;
  cityLine: string;
  website: string;
};

export async function updateClinicProfile(data: ClinicProfileInput) {
  return prisma.clinicProfile.update({ where: { id: "default" }, data });
}

export async function updateClinicSchedule(opensAtMinutes: number, closesAtMinutes: number) {
  return prisma.clinicProfile.update({
    where: { id: "default" },
    data: { opensAtMinutes, closesAtMinutes },
  });
}
