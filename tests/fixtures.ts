import type { ClinicProfile, Patient } from "@prisma/client";

export const clinic: ClinicProfile = {
  id: "default",
  name: "Dr. Darcy Mavignier",
  subtitle: "odontologia integrada",
  specialty: "Cirurgião-Dentista",
  cro: "CRO-CE 4157",
  phone: "(85) 99999-9999",
  address: "Rua das Flores, 123 - Centro",
  cityLine: "Fortaleza - CE - CEP 60000-000",
  website: "www.darcymavignier.com.br",
  opensAtMinutes: 8 * 60,
  closesAtMinutes: 19 * 60,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

export function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "p1",
    name: "Maria Silva",
    phone: "(85) 98888-7777",
    email: null,
    cpf: "123.456.789-00",
    birthDate: new Date("1990-01-10"),
    recordNumber: "A-12",
    notes: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}
