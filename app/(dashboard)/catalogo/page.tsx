import { requirePermission } from "@/lib/auth/guards";
import { formatBRL } from "@/lib/money";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { createCatalogAction, deleteCatalogAction, toggleCatalogAction, updateCatalogAction } from "./actions";

export default async function CatalogPage() {
  await requirePermission("catalog", "read");
  const items = await listCatalogItems(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <p className="text-sm text-zinc-500">Procedimentos e serviços odontológicos.</p>
      </div>
      <form action={createCatalogAction} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-4">
        <input name="name" placeholder="Nome" required className="rounded-md border p-2" />
        <input name="price" placeholder="Preço" required className="rounded-md border p-2" />
        <input name="durationMinutes" type="number" placeholder="Duração min" required className="rounded-md border p-2" />
        <input name="description" placeholder="Descrição" className="rounded-md border p-2" />
        <button className="rounded-md bg-red-700 px-4 py-2 font-semibold text-white md:col-span-4">Adicionar</button>
      </form>
      <div className="space-y-3">
        {items.map((item) => (
          <form key={item.id} action={updateCatalogAction.bind(null, item.id)} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-6">
            <input name="name" defaultValue={item.name} className="rounded-md border p-2" />
            <input name="price" defaultValue={(item.priceCents / 100).toFixed(2).replace(".", ",")} className="rounded-md border p-2" />
            <input name="durationMinutes" type="number" defaultValue={item.durationMinutes} className="rounded-md border p-2" />
            <input name="description" defaultValue={item.description ?? ""} className="rounded-md border p-2 md:col-span-2" />
            <button className="rounded-md border px-3">Salvar</button>
            <p className="text-sm text-zinc-500 md:col-span-2">{formatBRL(item.priceCents)} · {item.durationMinutes}min · {item.isActive ? "ativo" : "inativo"}</p>
            <button formAction={toggleCatalogAction.bind(null, item.id, !item.isActive)} className="rounded-md border px-3">
              {item.isActive ? "Inativar" : "Ativar"}
            </button>
            <button formAction={deleteCatalogAction.bind(null, item.id)} className="rounded-md border border-red-300 px-3 text-red-700">
              Excluir
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
