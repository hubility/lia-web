import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getLiaStatus, setLiaStatus, LiaStatusError } from "@/server/services/lia-status.service";

/** O serviço fala com outra plataforma: traduz suas falhas em erro legível. */
async function surfaced<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof LiaStatusError) {
      throw new TRPCError({ code: "BAD_GATEWAY", message: error.message, cause: error });
    }
    throw error;
  }
}

export const liaRouter = createTRPCRouter({
  getStatus: protectedProcedure.query(async (): Promise<boolean> => {
    return surfaced(() => getLiaStatus());
  }),

  setStatus: protectedProcedure
    .input(z.object({ isActive: z.boolean() }))
    .mutation(async ({ input }): Promise<boolean> => {
      return surfaced(() => setLiaStatus(input.isActive));
    }),
});
