import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/passwords";

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });
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

export async function getUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function countActiveAdmins() {
  return prisma.user.count({ where: { role: "admin", isActive: true } });
}

export async function updateUserDetails(
  id: string,
  input: { name: string; email: string; role: UserRole }
) {
  return prisma.user.update({
    where: { id },
    data: input,
  });
}

export async function updateUserPassword(
  id: string,
  password: string,
  keepSessionTokenHash?: string
) {
  const passwordHash = await hashPassword(password);

  return prisma.$transaction([
    prisma.user.update({ where: { id }, data: { passwordHash } }),
    prisma.session.deleteMany({
      where: {
        userId: id,
        ...(keepSessionTokenHash
          ? { tokenHash: { not: keepSessionTokenHash } }
          : {}),
      },
    }),
  ]);
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
