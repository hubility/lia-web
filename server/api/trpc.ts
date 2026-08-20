import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { getCurrentUser } from "@/lib/auth/session";

export const createTRPCContext = async () => ({});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/** Exige sessão da clínica. A sessão sai do cookie, legível dentro do route handler. */
export const protectedProcedure = t.procedure.use(async ({ next }) => {
  const user = await getCurrentUser();
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user } });
});
