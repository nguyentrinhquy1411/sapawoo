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
import dayjs from "dayjs";
import { Copy, GripVertical, Maximize2, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PriorityIcon } from "@/components/task/priority-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AssigneePicker } from "@/components/views/table/assignee-picker";
import { isTaskDragData, taskDragData } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import { isOverdue, taskKey, useDoneStatusIds } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";
import type { BoardStatus, Density, Task, TaskField } from "@/types";

interface TaskTableRowProps {
	task: Task;
	groupId: string;
	statuses: BoardStatus[];
	visibleFields: TaskField[];
	density: Density;
}

export function TaskTableRow({ task, groupId, statuses, visibleFields, density }: TaskTableRowProps) {
	const priorities = useAppStore((state) => state.priorities);
	const updateTask = useAppStore((state) => state.updateTask);
	const deleteTask = useAppStore((state) => state.deleteTask);
	const duplicateTask = useAppStore((state) => state.duplicateTask);
	const commentCount = useAppStore(
		(state) => state.comments.filter((comment) => comment.taskId === task.id).length,
	);
	const openTask = useUiStore((state) => state.openTask);
	const selectedTaskIds = useUiStore((state) => state.selectedTaskIds);
	const toggleSelected = useUiStore((state) => state.toggleSelected);
	const doneStatusIds = useDoneStatusIds();

	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(task.summary);
	const rowRef = useRef<HTMLTableRowElement>(null);
	const handleRef = useRef<HTMLButtonElement>(null);
	const [dragging, setDragging] = useState(false);
	const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

	useEffect(() => {
		const row = rowRef.current;
		const handle = handleRef.current;
		if (!row || !handle) return;

		return combine(
			draggable({
				element: row,
				dragHandle: handle,
				getInitialData: () => taskDragData(task.id, groupId),
				onDragStart: () => setDragging(true),
				onDrop: () => setDragging(false),
			}),
			dropTargetForElements({
				element: row,
				canDrop: ({ source }) => isTaskDragData(source.data) && source.data.taskId !== task.id,
				getData: ({ input }) =>
					attachClosestEdge(taskDragData(task.id, groupId), {
						element: row,
						input,
						allowedEdges: ["top", "bottom"],
					}),
				onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
				onDragLeave: () => setClosestEdge(null),
				onDrop: () => setClosestEdge(null),
			}),
		);
	}, [task.id, groupId]);

	const selected = selectedTaskIds.includes(task.id);
	const shows = (field: TaskField) => visibleFields.includes(field);
	const cellPadding = density === "compact" ? "py-1" : "py-2";

	const commitSummary = () => {
		if (draft.trim() && draft.trim() !== task.summary) updateTask(task.id, { summary: draft.trim() });
		else setDraft(task.summary);
		setEditing(false);
	};

	return (
		<tr
			ref={rowRef}
			className={cn(
				"group border-b border-border last:border-0 hover:bg-accent/30",
				selected && "bg-accent/40",
				dragging && "opacity-40",
				closestEdge === "top" && "shadow-[inset_0_2px_0_0_var(--color-primary)]",
				closestEdge === "bottom" && "shadow-[inset_0_-2px_0_0_var(--color-primary)]",
			)}
		>
			<td className={cn("w-8 pl-2 pr-0", cellPadding)}>
				<Button
					ref={handleRef}
					variant="ghost"
					size="icon-sm"
					className="size-6 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
				>
					<GripVertical className="size-3.5" />
				</Button>
			</td>

			<td className={cn("w-9 px-1", cellPadding)}>
				<Checkbox
					checked={selected}
					onCheckedChange={() => toggleSelected(task.id)}
					className={cn("opacity-0 transition-opacity group-hover:opacity-100", selected && "opacity-100")}
				/>
			</td>

			{shows("key") && (
				<td className={cn("w-24 px-2 font-mono text-xs text-muted-foreground", cellPadding)}>
					{taskKey(task)}
				</td>
			)}

			<td className={cn("px-2", cellPadding)}>
				{editing ? (
					<Input
						autoFocus
						value={draft}
						className="h-7"
						onChange={(event) => setDraft(event.target.value)}
						onBlur={commitSummary}
						onKeyDown={(event) => {
							if (event.key === "Enter") commitSummary();
							if (event.key === "Escape") {
								setDraft(task.summary);
								setEditing(false);
							}
						}}
					/>
				) : (
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							className="h-7 min-w-0 flex-1 justify-start rounded-md px-1 text-left font-medium text-foreground hover:bg-accent"
							title="Click to rename"
							onClick={() => setEditing(true)}
						>
							<span className="truncate">{task.summary}</span>
						</Button>
						{shows("comments") && commentCount > 0 && (
							<span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
								<MessageSquare className="size-3" />
								<span>{commentCount}</span>
							</span>
						)}
						<Button
							variant="ghost"
							size="icon-sm"
							className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
							title="Open task"
							onClick={() => openTask(task.id)}
						>
							<Maximize2 className="size-3.5" />
						</Button>
					</div>
				)}
			</td>

			{shows("status") && (
				<td className={cn("w-40 px-2", cellPadding)}>
					<Select value={task.statusId} onValueChange={(statusId) => updateTask(task.id, { statusId })}>
						<SelectTrigger className="h-7 border-0 bg-transparent shadow-none hover:bg-accent">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{statuses.map((status) => (
								<SelectItem key={status.id} value={status.id}>
									<span className="flex items-center gap-2">
										<span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
										<span>{status.name}</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</td>
			)}

			{shows("priority") && (
				<td className={cn("w-36 px-2", cellPadding)}>
					<Select
						value={task.priorityId}
						onValueChange={(priorityId) => updateTask(task.id, { priorityId })}
					>
						<SelectTrigger className="h-7 border-0 bg-transparent shadow-none hover:bg-accent">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{priorities.map((priority) => (
								<SelectItem key={priority.id} value={priority.id}>
									<span className="flex items-center gap-2">
										<PriorityIcon priority={priority} />
										<span>{priority.name}</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</td>
			)}

			{shows("assignees") && (
				<td className={cn("w-28 px-2", cellPadding)}>
					<AssigneePicker task={task} />
				</td>
			)}

			{shows("dueDate") && (
				<td className={cn("w-36 px-2", cellPadding)}>
					<Input
						type="date"
						value={task.endDate ? dayjs(task.endDate).format("YYYY-MM-DD") : ""}
						onChange={(event) =>
							updateTask(task.id, {
								endDate: event.target.value ? dayjs(event.target.value).toISOString() : null,
							})
						}
						className={cn(
							"h-7 border-0 bg-transparent px-1 text-xs shadow-none hover:bg-accent",
							isOverdue(task, doneStatusIds) && "font-medium text-destructive",
						)}
					/>
				</td>
			)}

			<td className={cn("w-10 pr-3", cellPadding)}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className="opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
						>
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onSelect={() => openTask(task.id)}>
							<span>Open task</span>
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => setEditing(true)}>
							<span>Rename</span>
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => duplicateTask(task.id)}>
							<Copy />
							<span>Duplicate</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
							onSelect={() => deleteTask(task.id)}
						>
							<Trash2 />
							<span>Delete</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</td>
		</tr>
	);
}
