import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  getRecentActivity,
  getUnseenActivityCount,
  markActivityAsSeen,
  type ActivityEvent,
} from "@/server/services/dashboard.service";

export const dashboardRouter = createTRPCRouter({
  getUnseenCount: publicProcedure.query(async (): Promise<number> => {
    return getUnseenActivityCount();
  }),

  getActivity: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(200).default(50) }))
    .query(async ({ input }): Promise<ActivityEvent[]> => {
      return getRecentActivity({ limit: input.limit });
    }),

  markActivitySeen: publicProcedure.mutation(async (): Promise<void> => {
    await markActivityAsSeen();
  }),
});
