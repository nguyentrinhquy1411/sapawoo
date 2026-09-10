import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
	draggable,
	dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
	type Edge,
	attachClosestEdge,
	extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { ChevronsUpDown, GripVertical, Inbox, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DropIndicator } from "@/components/dnd/drop-indicator";
import { TaskCard } from "@/components/task/task-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { ColumnHeader } from "@/components/views/kanban/column-header";
import { columnDragData, groupDropData, isColumnDragData, isTaskDragData } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import type { Density, Task, TaskField, TaskGroup } from "@/types";

interface KanbanColumnProps {
	group: TaskGroup;
	tasks: Task[];
	limit?: number;
	collapsed: boolean;
	visibleFields: TaskField[];
	density: Density;
	reorderable: boolean;
	onCreateTask: (groupId: string, summary: string, atTop: boolean) => void;
	onToggleCollapsed: (groupId: string) => void;
	onSetLimit: (groupId: string, limit: number | undefined) => void;
	onDeleteAll: (groupId: string) => void;
}

function Composer({ onSubmit, onCancel }: { onSubmit: (summary: string) => void; onCancel: () => void }) {
	const [draft, setDraft] = useState("");
	const ref = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		ref.current?.focus();
	}, []);

	const submit = () => {
		if (draft.trim()) onSubmit(draft.trim());
		setDraft("");
	};

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-card p-2 shadow-sm">
			<Textarea
				ref={ref}
				value={draft}
				placeholder="What needs to be done?"
				className="min-h-16 resize-none border-0 p-0 text-sm shadow-none focus-visible:ring-0"
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter" && !event.shiftKey) {
						event.preventDefault();
						submit();
					}
					if (event.key === "Escape") onCancel();
				}}
			/>
			<div className="flex items-center gap-2">
				<Button size="sm" onClick={submit} disabled={!draft.trim()}>
					<span>Add task</span>
				</Button>
				<Button variant="ghost" size="icon-sm" onClick={onCancel}>
					<X />
				</Button>
				<span className="ml-auto text-[10px] text-muted-foreground">Enter to add</span>
			</div>
		</div>
	);
}

export function KanbanColumn({
	group,
	tasks,
	limit,
	collapsed,
	visibleFields,
	density,
	reorderable,
	onCreateTask,
	onToggleCollapsed,
	onSetLimit,
	onDeleteAll,
}: KanbanColumnProps) {
	const columnRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const handleRef = useRef<HTMLButtonElement>(null);
	const [isTaskOver, setIsTaskOver] = useState(false);
	const [columnEdge, setColumnEdge] = useState<Edge | null>(null);
	const [composerAt, setComposerAt] = useState<"top" | "bottom" | null>(null);

	useEffect(() => {
		const column = columnRef.current;
		const list = listRef.current;
		if (!column || !list) return;

		const cleanups = [
			dropTargetForElements({
				element: list,
				canDrop: ({ source }) => isTaskDragData(source.data),
				getData: () => groupDropData(group.id),
				onDragEnter: () => setIsTaskOver(true),
				onDragLeave: () => setIsTaskOver(false),
				onDrop: () => setIsTaskOver(false),
			}),
			autoScrollForElements({ element: list }),
			dropTargetForElements({
				element: column,
				canDrop: ({ source }) => isColumnDragData(source.data) && source.data.groupId !== group.id,
				getData: ({ input }) =>
					attachClosestEdge(groupDropData(group.id), {
						element: column,
						input,
						allowedEdges: ["left", "right"],
					}),
				onDrag: ({ self }) => setColumnEdge(extractClosestEdge(self.data)),
				onDragLeave: () => setColumnEdge(null),
				onDrop: () => setColumnEdge(null),
			}),
		];

		if (reorderable && handleRef.current) {
			cleanups.push(
				draggable({
					element: handleRef.current,
					getInitialData: () => columnDragData(group.id),
				}),
			);
		}

		return combine(...cleanups);
	}, [group.id, reorderable]);

	if (collapsed) {
		return (
			<Button
				variant="ghost"
				className="flex h-full w-11 shrink-0 flex-col items-center gap-3 rounded-xl bg-secondary/50 px-0 py-3 hover:bg-secondary"
				onClick={() => onToggleCollapsed(group.id)}
			>
				<ChevronsUpDown className="size-4 text-muted-foreground" />
				<span className="size-2 rounded-full" style={{ backgroundColor: group.color }} />
				<span className="text-xs font-semibold [writing-mode:vertical-rl]">{group.name}</span>
				<Badge variant="muted">{tasks.length}</Badge>
			</Button>
		);
	}

	return (
		<div ref={columnRef} className="relative flex h-full w-72 shrink-0 flex-col gap-2">
			{columnEdge && <DropIndicator edge={columnEdge} />}

			<div className="flex items-center gap-1">
				{reorderable && (
					<Button
						ref={handleRef}
						variant="ghost"
						size="icon-sm"
						className="size-6 cursor-grab text-muted-foreground active:cursor-grabbing"
					>
						<GripVertical className="size-3.5" />
					</Button>
				)}
				<div className="min-w-0 flex-1">
					<ColumnHeader
						group={group}
						count={tasks.length}
						limit={limit}
						onAddTask={() => setComposerAt("bottom")}
						onCollapse={() => onToggleCollapsed(group.id)}
						onSetLimit={(value) => onSetLimit(group.id, value)}
						onClearDone={tasks.length > 0 ? () => onDeleteAll(group.id) : undefined}
					/>
				</div>
			</div>

			<div
				ref={listRef}
				className={cn(
					"flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-xl bg-secondary/40 p-2 transition-colors",
					isTaskOver && "bg-accent/60 ring-2 ring-ring",
				)}
			>
				{composerAt === "top" && (
					<Composer
						onSubmit={(summary) => onCreateTask(group.id, summary, true)}
						onCancel={() => setComposerAt(null)}
					/>
				)}

				{tasks.map((task) => (
					<TaskCard
						key={task.id}
						task={task}
						groupId={group.id}
						visibleFields={visibleFields}
						density={density}
					/>
				))}

				{tasks.length === 0 && composerAt === null && (
					<EmptyState icon={Inbox} title="No tasks" description="Drop a task here or add one." className="py-6" />
				)}

				{composerAt === "bottom" && (
					<Composer
						onSubmit={(summary) => onCreateTask(group.id, summary, false)}
						onCancel={() => setComposerAt(null)}
					/>
				)}

				{composerAt === null && (
					<Button
						variant="ghost"
						size="sm"
						className="justify-start gap-1 text-muted-foreground"
						onClick={() => setComposerAt("bottom")}
					>
						<Plus />
						<span>Add task</span>
					</Button>
				)}
			</div>
		</div>
	);
}
