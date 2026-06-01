import type { UserRole } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/passwords";

export async function listUsers() {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}

export async function createUser(input: { name: string; email: string; password: string; role: UserRole }) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
  });
}

export async function setUserActive(id: string, isActive: boolean) {
  return prisma.user.update({ where: { id }, data: { isActive } });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
