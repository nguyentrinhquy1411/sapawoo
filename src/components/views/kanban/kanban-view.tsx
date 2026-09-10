import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { useEffect, useMemo, useRef } from "react";
import { KanbanColumn } from "@/components/views/kanban/kanban-column";
import {
	isColumnDragData,
	isGroupDropData,
	isTaskDragData,
	neighboursForDrop,
} from "@/lib/dnd";
import { type QueryContext, buildGroups, groupPatchFor, groupTasks } from "@/lib/task-query";
import { useAppStore } from "@/store/use-app-store";
import type { ViewSettingsController } from "@/store/use-view-settings";
import type { Board, Task } from "@/types";

interface KanbanViewProps {
	board: Board;
	tasks: Task[];
	context: QueryContext;
	controller: ViewSettingsController;
}

export function KanbanView({ board, tasks, context, controller }: KanbanViewProps) {
	const rankTask = useAppStore((state) => state.rankTask);
	const createTask = useAppStore((state) => state.createTask);
	const updateTask = useAppStore((state) => state.updateTask);
	const deleteTasks = useAppStore((state) => state.deleteTasks);
	const reorderStatuses = useAppStore((state) => state.reorderStatuses);
	const boardRef = useRef<HTMLDivElement>(null);

	const { settings, patchSettings, toggleGroupCollapsed } = controller;
	const groupBy = settings.groupBy === "none" ? "status" : settings.groupBy;

	const columns = useMemo(() => {
		const groups = buildGroups(groupBy, context);
		const grouped = groupTasks(tasks, groups, groupBy, settings.sorts, context);
		return settings.showEmptyGroups ? grouped : grouped.filter((column) => column.tasks.length > 0);
	}, [tasks, groupBy, settings.sorts, settings.showEmptyGroups, context]);

	useEffect(() => {
		const element = boardRef.current;
		if (!element) return;
		return autoScrollForElements({ element });
	}, []);

	useEffect(() => {
		return monitorForElements({
			canMonitor: ({ source }) => isTaskDragData(source.data) || isColumnDragData(source.data),
			onDrop: ({ source, location }) => {
				const dropTargets = location.current.dropTargets;
				if (dropTargets.length === 0) return;

				if (isColumnDragData(source.data)) {
					const target = dropTargets.find((entry) => isGroupDropData(entry.data));
					if (!target || groupBy !== "status") return;

					const edge = extractClosestEdge(target.data);
					const targetGroupId = (target.data as { groupId: string }).groupId;
					const order = columns.map((column) => column.group.id).filter((id) => id !== source.data.groupId);
					const targetIndex = order.indexOf(targetGroupId);
					if (targetIndex === -1) return;

					order.splice(edge === "right" ? targetIndex + 1 : targetIndex, 0, source.data.groupId);
					reorderStatuses(board.id, order);
					return;
				}

				if (!isTaskDragData(source.data)) return;

				const cardTarget = dropTargets.find((entry) => isTaskDragData(entry.data));
				const groupTarget = dropTargets.find((entry) => isGroupDropData(entry.data));
				const targetGroupId = cardTarget
					? (cardTarget.data as { groupId: string }).groupId
					: (groupTarget?.data as { groupId: string } | undefined)?.groupId;
				if (!targetGroupId) return;

				const targetColumn = columns.find((column) => column.group.id === targetGroupId);
				if (!targetColumn) return;

				const neighbours = neighboursForDrop(
					targetColumn.tasks,
					source.data.taskId,
					cardTarget ? (cardTarget.data as { taskId: string }).taskId : null,
					cardTarget ? extractClosestEdge(cardTarget.data) : null,
				);

				rankTask(source.data.taskId, groupPatchFor(groupBy, targetGroupId), neighbours);
			},
		});
	}, [columns, groupBy, rankTask, reorderStatuses, board.id]);

	const handleCreateTask = (groupId: string, summary: string, atTop: boolean) => {
		const statusId = groupBy === "status" ? groupId : context.statuses[0]?.id;
		if (!statusId) return;

		const created = createTask({ boardId: board.id, statusId, summary, atTop });
		if (created && groupBy !== "status") updateTask(created.id, groupPatchFor(groupBy, groupId));
	};

	return (
		<div ref={boardRef} className="flex h-full gap-4 overflow-x-auto p-6">
			{columns.map((column) => (
				<KanbanColumn
					key={column.group.id}
					group={column.group}
					tasks={column.tasks}
					limit={settings.columnLimits[column.group.id]}
					collapsed={settings.collapsedGroupIds.includes(column.group.id)}
					visibleFields={settings.visibleFields}
					density={settings.density}
					reorderable={groupBy === "status"}
					onCreateTask={handleCreateTask}
					onToggleCollapsed={toggleGroupCollapsed}
					onSetLimit={(groupId, limit) => {
						const columnLimits = { ...settings.columnLimits };
						if (limit === undefined) delete columnLimits[groupId];
						else columnLimits[groupId] = limit;
						patchSettings({ columnLimits });
					}}
					onDeleteAll={(groupId) => {
						const target = columns.find((item) => item.group.id === groupId);
						deleteTasks(target?.tasks.map((task) => task.id) ?? []);
					}}
				/>
			))}
		</div>
	);
}
