import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, withApiErrors } from "@/lib/http";
import { listCatalogItems } from "@/lib/modules/catalog/service";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    return jsonOk(await listCatalogItems(false));
  });
}
