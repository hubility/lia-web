import { createTRPCRouter } from "@/server/api/trpc";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { liaRouter } from "@/server/api/routers/lia";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  lia: liaRouter,
});

export type AppRouter = typeof appRouter;
