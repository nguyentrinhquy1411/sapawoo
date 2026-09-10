import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { routeTree } from "@/router";

function renderAt(path: string) {
	const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }) });
	return render(<RouterProvider router={router as never} />);
}

afterEach(() => {
	localStorage.clear();
});

test("dashboard renders seeded stats", async () => {
	renderAt("/");
	await waitFor(() => expect(screen.getAllByText("Dashboard").length).toBeGreaterThan(0));
	expect(screen.getByText("Total tasks")).toBeDefined();
	expect(screen.getByText("Tasks by status")).toBeDefined();
});

test("boards page lists every seeded board", async () => {
	renderAt("/boards");
	await waitFor(() => expect(screen.getAllByText("Engineering").length).toBeGreaterThan(0));
	expect(screen.getAllByText("Marketing").length).toBeGreaterThan(0);
	expect(screen.getAllByText("Design").length).toBeGreaterThan(0);
});

test("kanban view renders every status column with its tasks", async () => {
	renderAt("/boards/ENG?view=kanban");
	await waitFor(() => expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0));
	expect(screen.getByText("Add LexoRank rebalance job")).toBeDefined();
	expect(screen.getAllByText("ENG-1").length).toBeGreaterThan(0);
});

test("table view renders grouped rows", async () => {
	renderAt("/boards/ENG?view=table");
	await waitFor(() => expect(screen.getAllByText("Summary").length).toBeGreaterThan(0));
	expect(screen.getByText("Set up cursor pagination for task search")).toBeDefined();
});
