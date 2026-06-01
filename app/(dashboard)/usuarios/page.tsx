import { requirePermission } from "@/lib/auth/guards";
import { listUsers } from "@/lib/modules/users/service";
import { createUserAction, deleteUserAction, toggleUserAction } from "./actions";

export default async function UsersPage() {
  await requirePermission("users", "read");
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Usuários</h1>
      <form action={createUserAction} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <input name="name" placeholder="Nome" required className="rounded-md border p-2" />
        <input name="email" type="email" placeholder="Email" required className="rounded-md border p-2" />
        <input name="password" type="password" placeholder="Senha" required className="rounded-md border p-2" />
        <select name="role" defaultValue="assistant" className="rounded-md border p-2">
          <option value="admin">Admin</option>
          <option value="dentist">Dentista</option>
          <option value="assistant">Assistente</option>
        </select>
        <button className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white md:col-span-4">Criar usuário</button>
      </form>
      {users.map((user) => (
        <article key={user.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email} · {user.role} · {user.isActive ? "ativo" : "inativo"}</p>
          </div>
          <form className="flex gap-2">
            <button formAction={toggleUserAction.bind(null, user.id, !user.isActive)} className="rounded-md border px-3 py-1 text-sm">
              {user.isActive ? "Inativar" : "Ativar"}
            </button>
            <button formAction={deleteUserAction.bind(null, user.id)} className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-700">
              Excluir
            </button>
          </form>
        </article>
      ))}
    </div>
  );
}
