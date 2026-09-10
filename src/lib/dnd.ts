import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { Task } from "@/types";

const TASK_DRAG = Symbol("task-drag");
const GROUP_DROP = Symbol("group-drop");
const COLUMN_DRAG = Symbol("column-drag");

type DragRecord = Record<string | symbol, unknown>;

export type TaskDragData = DragRecord & { taskId: string; groupId: string };

export type GroupDropData = DragRecord & { groupId: string };

export type ColumnDragData = DragRecord & { groupId: string };

export function taskDragData(taskId: string, groupId: string): TaskDragData {
	return { [TASK_DRAG]: true, taskId, groupId };
}

export function groupDropData(groupId: string): GroupDropData {
	return { [GROUP_DROP]: true, groupId };
}

export function columnDragData(groupId: string): ColumnDragData {
	return { [COLUMN_DRAG]: true, groupId };
}

export function isTaskDragData(data: DragRecord): data is TaskDragData {
	return data[TASK_DRAG] === true;
}

export function isGroupDropData(data: DragRecord): data is GroupDropData {
	return data[GROUP_DROP] === true;
}

export function isColumnDragData(data: DragRecord): data is ColumnDragData {
	return data[COLUMN_DRAG] === true;
}

export function neighboursForDrop(
	tasks: Task[],
	draggedTaskId: string,
	targetTaskId: string | null,
	edge: Edge | null,
) {
	const siblings = tasks.filter((task) => task.id !== draggedTaskId);

	if (!targetTaskId) {
		return { rankBeforeTaskId: siblings.at(-1)?.id ?? null, rankAfterTaskId: null };
	}

	const targetIndex = siblings.findIndex((task) => task.id === targetTaskId);
	if (targetIndex === -1) {
		return { rankBeforeTaskId: siblings.at(-1)?.id ?? null, rankAfterTaskId: null };
	}

	const insertIndex = edge === "bottom" ? targetIndex + 1 : targetIndex;
	return {
		rankBeforeTaskId: siblings[insertIndex - 1]?.id ?? null,
		rankAfterTaskId: siblings[insertIndex]?.id ?? null,
	};
}
