"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/passwords";
import { createSession, destroySession } from "@/lib/auth/session";

type LoginState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

const loginSchema = z.object({
  email: z.string().email("Informe um email válido.").trim(),
  password: z.string().min(1, "Informe a senha."),
});

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { message: "Email ou senha inválidos." };
  }

  await createSession(user.id);
  redirect("/agenda");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
