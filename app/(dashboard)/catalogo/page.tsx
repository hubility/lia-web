import { requirePermission } from "@/lib/auth/guards";
import { listCatalogItems } from "@/lib/modules/catalog/service";
import { listMedications } from "@/lib/modules/medications/service";
import { listCidCodes } from "@/lib/modules/cid/service";
import { CatalogTabs } from "@/components/catalog/catalog-tabs";

export default async function CatalogPage() {
  await requirePermission("catalog", "read");
  const [items, medications, cidCodes] = await Promise.all([
    listCatalogItems(true),
    listMedications(true),
    listCidCodes(true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Procedimentos, medicamentos e CID.
        </p>
      </div>
      <CatalogTabs items={items} medications={medications} cidCodes={cidCodes} />
    </div>
  );
}
