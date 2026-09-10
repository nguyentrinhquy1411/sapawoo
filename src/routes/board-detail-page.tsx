import { Link, useParams, useSearch } from "@tanstack/react-router";
import { LayoutGrid, Settings, SlidersHorizontal, Star, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { KanbanView } from "@/components/views/kanban/kanban-view";
import { TableView } from "@/components/views/table/table-view";
import { FilterChips } from "@/components/views/toolbar/filter-chips";
import { ViewToolbar } from "@/components/views/toolbar/view-toolbar";
import { buildGroups, filterTasks } from "@/lib/task-query";
import { cn } from "@/lib/utils";
import { useBoardByKey, useBoardTasks, useQueryContext } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import { useViewSettings } from "@/store/use-view-settings";
import type { BoardApp } from "@/types";

const VIEWS: Array<{ app: BoardApp; label: string; icon: typeof LayoutGrid }> = [
	{ app: "kanban", label: "Board", icon: LayoutGrid },
	{ app: "table", label: "Table", icon: Table2 },
];

export function BoardDetailPage() {
	const { boardKey } = useParams({ from: "/boards/$boardKey" });
	const { view } = useSearch({ from: "/boards/$boardKey" });
	const app: BoardApp = view ?? "kanban";

	const board = useBoardByKey(boardKey);
	const allTasks = useBoardTasks(board?.id);
	const context = useQueryContext(board?.id);
	const toggleStar = useAppStore((state) => state.toggleStar);
	const [createOpen, setCreateOpen] = useState(false);

	const controller = useViewSettings(`${board?.id ?? "none"}-view-${app}`, app);
	const { settings } = controller;

	const tasks = useMemo(
		() => filterTasks(allTasks, settings.filters, context),
		[allTasks, settings.filters, context],
	);
	const groups = useMemo(
		() => buildGroups(settings.groupBy === "none" ? "status" : settings.groupBy, context),
		[settings.groupBy, context],
	);

	if (!board) {
		return (
			<>
				<TopBar title="Board not found" />
				<div className="p-6">
					<Card>
						<CardContent className="p-6 text-sm text-muted-foreground">
							<span>No board with key {boardKey}.</span>
						</CardContent>
					</Card>
				</div>
			</>
		);
	}

	return (
		<>
			<TopBar
				title={board.name}
				subtitle={board.description}
				breadcrumbs={[{ label: "Boards", to: "/boards" }]}
				actions={
					<>
						<div className="inline-flex items-center gap-1 rounded-lg bg-secondary p-1">
							{VIEWS.map((item) => (
								<Button
									key={item.app}
									asChild
									variant="ghost"
									size="sm"
									className={cn(
										"gap-1.5 text-muted-foreground",
										app === item.app && "bg-card text-foreground shadow-2xs",
									)}
								>
									<Link to="/boards/$boardKey" params={{ boardKey }} search={{ view: item.app }}>
										<item.icon />
										<span>{item.label}</span>
									</Link>
								</Button>
							))}
						</div>

						<Button
							variant="ghost"
							size="icon"
							onClick={() => toggleStar(board.id)}
							className={board.starred ? "text-primary" : "text-muted-foreground"}
						>
							<Star className={cn(board.starred && "fill-current")} />
						</Button>

						<Button asChild variant="ghost" size="icon">
							<Link to="/boards/$boardKey/settings" params={{ boardKey }}>
								<Settings />
							</Link>
						</Button>
					</>
				}
			/>

			<ViewToolbar
				app={app}
				controller={controller}
				statuses={context.statuses}
				groups={groups}
				onCreateTask={() => setCreateOpen(true)}
			/>

			<FilterChips
				controller={controller}
				statuses={context.statuses}
				shown={tasks.length}
				total={allTasks.length}
			/>

			<CreateTaskDialog
				board={board}
				statuses={context.statuses}
				open={createOpen}
				onOpenChange={setCreateOpen}
			/>

			<div className="min-h-0 flex-1 overflow-auto">
				{app === "kanban" ? (
					<KanbanView board={board} tasks={tasks} context={context} controller={controller} />
				) : (
					<div className="p-6">
						{context.statuses.length === 0 ? (
							<Card>
								<CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
									<SlidersHorizontal className="size-4" />
									<span>This board has no statuses yet.</span>
								</CardContent>
							</Card>
						) : (
							<TableView board={board} tasks={tasks} context={context} controller={controller} />
						)}
					</div>
				)}
			</div>
		</>
	);
}
