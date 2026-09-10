import { dropTargetForElements, monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, SearchX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { BulkActionsBar } from "@/components/views/table/bulk-actions-bar";
import { TaskTableRow } from "@/components/views/table/table-row";
import { groupDropData, isGroupDropData, isTaskDragData, neighboursForDrop } from "@/lib/dnd";
import { type QueryContext, buildGroups, groupPatchFor, groupTasks } from "@/lib/task-query";
import { TASK_FIELD_LABELS } from "@/lib/view-settings";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";
import type { ViewSettingsController } from "@/store/use-view-settings";
import type { Board, SortField, Task, TaskField, TaskGroup } from "@/types";

const COLUMN_SORT_FIELD: Partial<Record<TaskField | "summary", SortField>> = {
	key: "key",
	summary: "summary",
	status: "status",
	priority: "priority",
	dueDate: "endDate",
};

interface TableViewProps {
	board: Board;
	tasks: Task[];
	context: QueryContext;
	controller: ViewSettingsController;
}

function GroupSection({
	group,
	tasks,
	board,
	context,
	controller,
	collapsed,
}: TableViewProps & { group: TaskGroup; collapsed: boolean }) {
	const createTask = useAppStore((state) => state.createTask);
	const updateTask = useAppStore((state) => state.updateTask);
	const selectedTaskIds = useUiStore((state) => state.selectedTaskIds);
	const setSelected = useUiStore((state) => state.setSelected);
	const [composing, setComposing] = useState(false);
	const [draft, setDraft] = useState("");
	const sectionRef = useRef<HTMLDivElement>(null);
	const [isOver, setIsOver] = useState(false);

	useEffect(() => {
		const element = sectionRef.current;
		if (!element) return;

		return dropTargetForElements({
			element,
			canDrop: ({ source }) => isTaskDragData(source.data),
			getData: () => groupDropData(group.id),
			onDragEnter: () => setIsOver(true),
			onDragLeave: () => setIsOver(false),
			onDrop: () => setIsOver(false),
		});
	}, [group.id]);

	const { settings, toggleGroupCollapsed, patchSettings } = controller;
	const shows = (field: TaskField) => settings.visibleFields.includes(field);
	const groupTaskIds = tasks.map((task) => task.id);
	const allSelected = groupTaskIds.length > 0 && groupTaskIds.every((id) => selectedTaskIds.includes(id));

	const toggleSort = (field: SortField) => {
		const current = settings.sorts.find((rule) => rule.field === field);
		if (!current) patchSettings({ sorts: [{ field, direction: "asc" }] });
		else if (current.direction === "asc") patchSettings({ sorts: [{ field, direction: "desc" }] });
		else patchSettings({ sorts: [] });
	};

	const submitTask = () => {
		if (!draft.trim()) return;
		const statusId = settings.groupBy === "status" ? group.id : context.statuses[0]?.id;
		if (!statusId) return;
		const created = createTask({ boardId: board.id, statusId, summary: draft.trim() });
		if (created && settings.groupBy !== "status" && settings.groupBy !== "none") {
			updateTask(created.id, groupPatchFor(settings.groupBy, group.id));
		}
		setDraft("");
	};

	const sortIndicator = (field: TaskField | "summary") => {
		const sortField = COLUMN_SORT_FIELD[field];
		const rule = settings.sorts.find((item) => item.field === sortField);
		if (!rule) return null;
		return rule.direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />;
	};

	const headerCell = (field: TaskField | "summary", className?: string) => {
		const sortField = COLUMN_SORT_FIELD[field];
		const label = field === "summary" ? "Summary" : TASK_FIELD_LABELS[field];
		return (
			<th className={cn("px-2 text-left", className)}>
				{sortField ? (
					<Button
						variant="ghost"
						size="sm"
						className="-ml-2 h-7 gap-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
						onClick={() => toggleSort(sortField)}
					>
						<span>{label}</span>
						{sortIndicator(field)}
					</Button>
				) : (
					<span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
				)}
			</th>
		);
	};

	return (
		<div
			ref={sectionRef}
			className={cn(
				"overflow-hidden rounded-xl border border-border bg-card transition-colors",
				isOver && "border-primary ring-1 ring-primary",
			)}
		>
			<div className="flex items-center gap-2 border-b border-border px-2 py-2">
				<Button
					variant="ghost"
					size="sm"
					className="gap-2"
					onClick={() => toggleGroupCollapsed(group.id)}
				>
					{collapsed ? <ChevronRight /> : <ChevronDown />}
					<span className="size-2 rounded-full" style={{ backgroundColor: group.color }} />
					<span className="font-semibold">{group.name}</span>
					<Badge variant="muted">{tasks.length}</Badge>
				</Button>

				{tasks.length > 0 && (
					<Checkbox
						checked={allSelected}
						onCheckedChange={(checked) =>
							setSelected(
								checked
									? [...new Set([...selectedTaskIds, ...groupTaskIds])]
									: selectedTaskIds.filter((id) => !groupTaskIds.includes(id)),
							)
						}
						className="ml-1"
					/>
				)}

				<Button
					variant="ghost"
					size="sm"
					className="ml-auto gap-1 text-muted-foreground"
					onClick={() => setComposing(true)}
				>
					<Plus />
					<span>Add task</span>
				</Button>
			</div>

			{!collapsed && (
				<>
					<table className="w-full table-fixed border-collapse text-sm">
						<thead className="sticky top-0 z-10 bg-card">
							<tr className="border-b border-border">
								<th className="w-8" />
								<th className="w-9" />
								{shows("key") && headerCell("key", "w-24")}
								{headerCell("summary")}
								{shows("status") && headerCell("status", "w-40")}
								{shows("priority") && headerCell("priority", "w-36")}
								{shows("assignees") && headerCell("assignees", "w-28")}
								{shows("dueDate") && headerCell("dueDate", "w-36")}
								<th className="w-10" />
							</tr>
						</thead>
						<tbody>
							{tasks.map((task) => (
								<TaskTableRow
									key={task.id}
									task={task}
									groupId={group.id}
									statuses={context.statuses}
									visibleFields={settings.visibleFields}
									density={settings.density}
								/>
							))}
							{tasks.length === 0 && !composing && (
								<tr>
									<td colSpan={9} className="px-4 py-5 text-center text-sm text-muted-foreground">
										<span>No tasks in this group.</span>
									</td>
								</tr>
							)}
						</tbody>
					</table>

					{composing && (
						<div className="flex items-center gap-2 border-t border-border p-2">
							<Input
								autoFocus
								value={draft}
								placeholder="Task summary"
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") submitTask();
									if (event.key === "Escape") setComposing(false);
								}}
							/>
							<Button size="sm" onClick={submitTask} disabled={!draft.trim()}>
								<span>Add</span>
							</Button>
							<Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
								<span>Cancel</span>
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export function TableView(props: TableViewProps) {
	const { tasks, context, controller } = props;
	const { settings } = controller;
	const rankTask = useAppStore((state) => state.rankTask);

	const groups = useMemo(() => {
		const built = buildGroups(settings.groupBy, context);
		const grouped = groupTasks(tasks, built, settings.groupBy, settings.sorts, context);
		return settings.showEmptyGroups ? grouped : grouped.filter((entry) => entry.tasks.length > 0);
	}, [tasks, settings.groupBy, settings.sorts, settings.showEmptyGroups, context]);

	useEffect(() => {
		return monitorForElements({
			canMonitor: ({ source }) => isTaskDragData(source.data),
			onDrop: ({ source, location }) => {
				if (!isTaskDragData(source.data)) return;

				const dropTargets = location.current.dropTargets;
				const rowTarget = dropTargets.find((entry) => isTaskDragData(entry.data));
				const sectionTarget = dropTargets.find((entry) => isGroupDropData(entry.data));
				const targetGroupId = rowTarget
					? (rowTarget.data as { groupId: string }).groupId
					: (sectionTarget?.data as { groupId: string } | undefined)?.groupId;
				if (!targetGroupId) return;

				const targetGroup = groups.find((entry) => entry.group.id === targetGroupId);
				if (!targetGroup) return;

				const neighbours = neighboursForDrop(
					targetGroup.tasks,
					source.data.taskId,
					rowTarget ? (rowTarget.data as { taskId: string }).taskId : null,
					rowTarget ? extractClosestEdge(rowTarget.data) : null,
				);

				rankTask(source.data.taskId, groupPatchFor(settings.groupBy, targetGroupId), neighbours);
			},
		});
	}, [groups, settings.groupBy, rankTask]);

	if (tasks.length === 0) {
		return (
			<EmptyState
				icon={SearchX}
				title="No tasks match this view"
				description="Try clearing the filters or the search term."
				className="rounded-xl border border-dashed border-border bg-card py-16"
			/>
		);
	}

	return (
		<div className="flex flex-col gap-4 pb-16">
			{groups.map((entry) => (
				<GroupSection
					key={entry.group.id}
					{...props}
					group={entry.group}
					tasks={entry.tasks}
					collapsed={settings.collapsedGroupIds.includes(entry.group.id)}
				/>
			))}
			<BulkActionsBar statuses={context.statuses} />
		</div>
	);
}
