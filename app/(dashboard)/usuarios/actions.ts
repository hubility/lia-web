"use server";

import type { UserRole } from "@/app/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { requiredText } from "@/lib/forms";
import { requirePermission } from "@/lib/auth/guards";
import { createUser, deleteUser, setUserActive } from "@/lib/modules/users/service";

export async function createUserAction(formData: FormData) {
  await requirePermission("users", "create");
  await createUser({
    name: requiredText(formData, "name"),
    email: requiredText(formData, "email"),
    password: requiredText(formData, "password"),
    role: requiredText(formData, "role") as UserRole,
  });
  revalidatePath("/usuarios");
}

export async function toggleUserAction(id: string, isActive: boolean) {
  await requirePermission("users", "update");
  await setUserActive(id, isActive);
  revalidatePath("/usuarios");
}

export async function deleteUserAction(id: string) {
  await requirePermission("users", "delete");
  await deleteUser(id);
  revalidatePath("/usuarios");
}
