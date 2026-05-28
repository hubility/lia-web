import { requireApiKey } from "@/lib/auth/api-keys";
import { jsonOk, withApiErrors } from "@/lib/http";
import { createQuote, listQuotes } from "@/lib/modules/quotes/service";

export async function GET(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    return jsonOk(await listQuotes());
  });
}

export async function POST(request: Request) {
  return withApiErrors(async () => {
    await requireApiKey(request);
    const body = await request.json();
    return jsonOk(await createQuote({ ...body, issueDate: new Date(body.issueDate) }), { status: 201 });
  });
}
