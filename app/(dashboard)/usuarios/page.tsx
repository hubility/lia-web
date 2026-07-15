import { requirePermission } from "@/lib/auth/guards";
import { listUsers } from "@/lib/modules/users/service";
import { UsersManager } from "./users-manager";

export default async function UsersPage() {
  const currentUser = await requirePermission("users", "read");
  const users = await listUsers();

  return <UsersManager users={users} currentUserId={currentUser.id} />;
}
