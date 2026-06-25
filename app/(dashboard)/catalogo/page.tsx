import { requirePermission } from "@/lib/auth/guards";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { CatalogList } from "@/components/catalog/catalog-list";

export default async function CatalogPage() {
  await requirePermission("catalog", "read");
  const items = await listCatalogItems(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <p className="text-sm text-muted-foreground">Procedimentos e serviços odontológicos.</p>
      </div>
      <CatalogList items={items} />
    </div>
  );
}
