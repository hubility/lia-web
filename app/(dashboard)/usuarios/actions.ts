"use server";

import { Prisma, type UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requirePermission } from "@/lib/auth/guards";
import { hashToken } from "@/lib/auth/tokens";
import {
  countActiveAdmins,
  createUser,
  deleteUser,
  getUser,
  setUserActive,
  updateUserDetails,
  updateUserPassword,
} from "@/lib/modules/users/service";

export type UserActionResult =
  | { ok: true }
  | { ok: false; error: string };

const USER_ROLES: UserRole[] = ["admin", "dentist", "assistant"];

function textField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseUserDetails(formData: FormData) {
  const name = textField(formData, "name");
  const email = textField(formData, "email").toLowerCase();
  const role = textField(formData, "role") as UserRole;

  if (name.length < 2 || name.length > 100) {
    return "Informe um nome entre 2 e 100 caracteres.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return "Informe um e-mail válido.";
  }
  if (!USER_ROLES.includes(role)) {
    return "Selecione um perfil válido.";
  }

  return { name, email, role };
}

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  await requirePermission("users", "create");
  const details = parseUserDetails(formData);
  const password = textField(formData, "password");

  if (typeof details === "string") return { ok: false, error: details };
  if (password.length < 8 || password.length > 128) {
    return { ok: false, error: "A senha deve ter entre 8 e 128 caracteres." };
  }

  try {
    await createUser({ ...details, password });
    revalidatePath("/usuarios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "Já existe um usuário com este e-mail." };
    }
    throw error;
  }
}

export async function updateUserAction(
  id: string,
  formData: FormData
): Promise<UserActionResult> {
  const currentUser = await requirePermission("users", "update");
  const target = await getUser(id);
  if (!target) return { ok: false, error: "Usuário não encontrado." };

  const details = parseUserDetails(formData);
  if (typeof details === "string") return { ok: false, error: details };

  if (target.id === currentUser.id && details.role !== target.role) {
    return { ok: false, error: "Seu perfil deve ser alterado por outro administrador." };
  }

  if (
    target.role === "admin" &&
    target.isActive &&
    details.role !== "admin" &&
    (await countActiveAdmins()) <= 1
  ) {
    return { ok: false, error: "A clínica precisa manter ao menos um administrador ativo." };
  }

  try {
    await updateUserDetails(id, details);
    revalidatePath("/usuarios");
    return { ok: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "Já existe um usuário com este e-mail." };
    }
    throw error;
  }
}

export async function changeUserPasswordAction(
  id: string,
  formData: FormData
): Promise<UserActionResult> {
  const currentUser = await requirePermission("users", "update");
  const target = await getUser(id);
  if (!target) return { ok: false, error: "Usuário não encontrado." };

  const password = textField(formData, "password");
  const confirmation = textField(formData, "passwordConfirmation");
  if (password.length < 8 || password.length > 128) {
    return { ok: false, error: "A senha deve ter entre 8 e 128 caracteres." };
  }
  if (password !== confirmation) {
    return { ok: false, error: "As senhas informadas não coincidem." };
  }

  const sessionToken = (await cookies()).get("lia_session")?.value;
  const keepSessionTokenHash =
    target.id === currentUser.id && sessionToken
      ? hashToken(sessionToken)
      : undefined;

  await updateUserPassword(id, password, keepSessionTokenHash);
  revalidatePath("/usuarios");
  return { ok: true };
}

export async function toggleUserAction(
  id: string,
  isActive: boolean
): Promise<UserActionResult> {
  const currentUser = await requirePermission("users", "update");
  const target = await getUser(id);
  if (!target) return { ok: false, error: "Usuário não encontrado." };

  if (!isActive && target.id === currentUser.id) {
    return { ok: false, error: "Você não pode inativar a própria sessão." };
  }
  if (!isActive && target.role === "admin" && target.isActive) {
    const activeAdmins = await countActiveAdmins();
    if (activeAdmins <= 1) {
      return { ok: false, error: "A clínica precisa manter ao menos um administrador ativo." };
    }
  }

  await setUserActive(id, isActive);
  revalidatePath("/usuarios");
  return { ok: true };
}

export async function deleteUserAction(id: string): Promise<UserActionResult> {
  const currentUser = await requirePermission("users", "delete");
  const target = await getUser(id);
  if (!target) return { ok: false, error: "Usuário não encontrado." };
  if (target.id === currentUser.id) {
    return { ok: false, error: "Você não pode excluir a própria sessão." };
  }
  if (target.isActive) {
    return { ok: false, error: "Inative o usuário antes de excluí-lo." };
  }

  await deleteUser(id);
  revalidatePath("/usuarios");
  return { ok: true };
}
