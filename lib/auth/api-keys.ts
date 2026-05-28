import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/tokens";

export async function requireApiKey(request: Request) {
  const token = request.headers.get("x-api-key");
  if (!token) throw new Response("Unauthorized", { status: 401 });

  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hashToken(token) } });
  if (!apiKey || !apiKey.isActive) throw new Response("Unauthorized", { status: 401 });

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey;
}
