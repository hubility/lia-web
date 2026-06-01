import { createTRPCRouter } from "@/server/api/trpc";
import { dashboardRouter } from "@/server/api/routers/dashboard";

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
