import { prisma } from "@/lib/db/prisma";

export type CertificateInput = {
  patientId: string;
  issueDate: Date;
  absenceStartDate: Date;
  absenceEndDate: Date;
  cidCodeId?: string | null;
  cid: string;
  cidDescription?: string | null;
  city: string;
  notes?: string | null;
};

export async function listCertificates() {
  return prisma.medicalCertificate.findMany({ include: { patient: true }, orderBy: { issueDate: "desc" } });
}

export async function getCertificate(id: string) {
  return prisma.medicalCertificate.findUniqueOrThrow({ where: { id }, include: { patient: true } });
}

export async function createCertificate(input: CertificateInput) {
  if (input.absenceEndDate < input.absenceStartDate) {
    throw new Error("Data final não pode ser anterior à inicial.");
  }
  return prisma.medicalCertificate.create({ data: input });
}

export async function updateCertificate(id: string, input: CertificateInput) {
  if (input.absenceEndDate < input.absenceStartDate) {
    throw new Error("Data final não pode ser anterior à inicial.");
  }
  return prisma.medicalCertificate.update({
    where: { id },
    data: {
      issueDate: input.issueDate,
      absenceStartDate: input.absenceStartDate,
      absenceEndDate: input.absenceEndDate,
      cidCodeId: input.cidCodeId,
      cid: input.cid,
      cidDescription: input.cidDescription,
      city: input.city,
      notes: input.notes,
    },
  });
}

export async function deleteCertificate(id: string) {
  return prisma.medicalCertificate.delete({ where: { id } });
}
