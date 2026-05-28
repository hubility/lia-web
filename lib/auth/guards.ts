import { notFound } from "next/navigation";
import { canAccessResource, type Action, type Resource, type Role } from "@/lib/permissions";
import { requireUser } from "@/lib/auth/session";

export async function requirePermission(resource: Resource, action: Action) {
  const user = await requireUser();
  if (!canAccessResource(user.role as Role, resource, action)) {
    notFound();
  }
  return user;
}
