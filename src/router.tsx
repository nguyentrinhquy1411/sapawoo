import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { BoardDetailPage } from "@/routes/board-detail-page";
import { BoardsPage } from "@/routes/boards-page";
import { BoardSettingsPage } from "@/routes/board-settings-page";
import { DashboardPage } from "@/routes/dashboard-page";
import { SettingsPage } from "@/routes/settings-page";
import type { BoardApp } from "@/types";

const rootRoute = createRootRoute({ component: AppShell });

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: DashboardPage,
});

const boardsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/boards",
	component: BoardsPage,
});

const boardDetailRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/boards/$boardKey",
	component: BoardDetailPage,
	validateSearch: (search: Record<string, unknown>): { view?: BoardApp } => ({
		view: search.view === "table" ? "table" : "kanban",
	}),
});

const boardSettingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/boards/$boardKey/settings",
	component: BoardSettingsPage,
});

const settingsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/settings",
	component: SettingsPage,
});

export const routeTree = rootRoute.addChildren([dashboardRoute, boardsRoute, boardDetailRoute, boardSettingsRoute, settingsRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
