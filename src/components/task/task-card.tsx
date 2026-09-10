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
import { AlignLeft, CalendarDays, Copy, Link2, MessageSquare, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AssigneeGroup } from "@/components/task/assignee-avatar";
import { PriorityIcon } from "@/components/task/priority-badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropIndicator } from "@/components/dnd/drop-indicator";
import { isTaskDragData, taskDragData } from "@/lib/dnd";
import { cn } from "@/lib/utils";
import { isOverdue, taskKey, useDoneStatusIds } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";
import type { Density, Task, TaskField } from "@/types";

interface TaskCardProps {
	task: Task;
	visibleFields: TaskField[];
	density: Density;
}

export function TaskCardBody({
	task,
	visibleFields,
	density,
	dragging,
}: TaskCardProps & { dragging?: boolean }) {
	const priority = useAppStore((state) => state.priorities.find((item) => item.id === task.priorityId));
	const users = useAppStore((state) => state.users);
	const commentCount = useAppStore(
		(state) => state.comments.filter((comment) => comment.taskId === task.id).length,
	);
	const duplicateTask = useAppStore((state) => state.duplicateTask);
	const deleteTask = useAppStore((state) => state.deleteTask);
	const openTask = useUiStore((state) => state.openTask);
	const doneStatusIds = useDoneStatusIds();

	const assignees = useMemo(
		() => users.filter((user) => task.assigneeIds.includes(user.id)),
		[users, task.assigneeIds],
	);
	const shows = (field: TaskField) => visibleFields.includes(field);
	const overdue = isOverdue(task, doneStatusIds);
	const compact = density === "compact";

	return (
		<div
			className={cn(
				"group/card relative flex flex-col rounded-lg border border-border bg-card shadow-2xs transition-all hover:border-primary/40 hover:shadow-md",
				compact ? "gap-1.5 p-2" : "gap-2.5 p-3",
				dragging && "rotate-1 shadow-lg",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<span className={cn("font-medium leading-snug", compact ? "line-clamp-1 text-xs" : "line-clamp-3 text-sm")}>
					{task.summary}
				</span>
				<div className="flex shrink-0 items-center gap-1">
					{shows("priority") && priority && <PriorityIcon priority={priority} className="mt-0.5" />}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 data-[state=open]:opacity-100"
								onPointerDown={(event) => event.stopPropagation()}
								onClick={(event) => event.stopPropagation()}
							>
								<MoreHorizontal className="size-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
							<DropdownMenuItem onSelect={() => openTask(task.id)}>
								<Link2 />
								<span>Open task</span>
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => navigator.clipboard?.writeText(taskKey(task))}>
								<Copy />
								<span>Copy key</span>
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
				</div>
			</div>

			<div className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
					{shows("key") && <span className="font-mono font-medium">{taskKey(task)}</span>}
					{shows("dueDate") && task.endDate && (
						<span className={cn("flex items-center gap-1", overdue && "font-medium text-destructive")}>
							<CalendarDays className="size-3" />
							<span>{dayjs(task.endDate).format("MMM D")}</span>
						</span>
					)}
					{shows("comments") && commentCount > 0 && (
						<span className="flex items-center gap-1">
							<MessageSquare className="size-3" />
							<span>{commentCount}</span>
						</span>
					)}
					{shows("description") && task.description && <AlignLeft className="size-3" />}
				</div>
				{shows("assignees") && <AssigneeGroup users={assignees} className="shrink-0" />}
			</div>
		</div>
	);
}

export function TaskCard({
	task,
	groupId,
	visibleFields,
	density,
}: TaskCardProps & { groupId: string }) {
	const openTask = useUiStore((state) => state.openTask);
	const ref = useRef<HTMLDivElement>(null);
	const [dragging, setDragging] = useState(false);
	const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		return combine(
			draggable({
				element,
				getInitialData: () => taskDragData(task.id, groupId),
				onDragStart: () => setDragging(true),
				onDrop: () => setDragging(false),
			}),
			dropTargetForElements({
				element,
				canDrop: ({ source }) => isTaskDragData(source.data) && source.data.taskId !== task.id,
				getData: ({ input }) =>
					attachClosestEdge(taskDragData(task.id, groupId), {
						element,
						input,
						allowedEdges: ["top", "bottom"],
					}),
				onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
				onDragLeave: () => setClosestEdge(null),
				onDrop: () => setClosestEdge(null),
			}),
		);
	}, [task.id, groupId]);

	return (
		<div
			ref={ref}
			className={cn("relative cursor-grab active:cursor-grabbing", dragging && "opacity-40")}
			onClick={() => openTask(task.id)}
		>
			{closestEdge === "top" && <DropIndicator edge="top" />}
			<TaskCardBody task={task} visibleFields={visibleFields} density={density} />
			{closestEdge === "bottom" && <DropIndicator edge="bottom" />}
		</div>
	);
}
