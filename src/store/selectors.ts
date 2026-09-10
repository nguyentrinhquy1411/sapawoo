import dayjs from "dayjs";
import { useMemo } from "react";
import type { QueryContext } from "@/lib/task-query";
import { useAppStore } from "@/store/use-app-store";
import type { Board, BoardStatus, BoardView, Task, User } from "@/types";

export function useBoardByKey(boardKey: string): Board | undefined {
	return useAppStore((state) => state.boards.find((board) => board.key === boardKey));
}

export function useBoardStatuses(boardId: string | undefined): BoardStatus[] {
	const statuses = useAppStore((state) => state.statuses);
	return useMemo(
		() => statuses.filter((status) => status.boardId === boardId).sort((a, b) => a.rank - b.rank),
		[statuses, boardId],
	);
}

export function useBoardTasks(boardId: string | undefined): Task[] {
	const tasks = useAppStore((state) => state.tasks);
	return useMemo(() => tasks.filter((task) => task.boardId === boardId), [tasks, boardId]);
}

export function useBoardViews(boardId: string | undefined): BoardView[] {
	const views = useAppStore((state) => state.views);
	return useMemo(
		() => views.filter((view) => view.boardId === boardId).sort((a, b) => a.rank - b.rank),
		[views, boardId],
	);
}

export function useDoneStatusIds(): Set<string> {
	const statuses = useAppStore((state) => state.statuses);
	return useMemo(
		() => new Set(statuses.filter((status) => status.statusCategory === "done").map((status) => status.id)),
		[statuses],
	);
}

export function useQueryContext(boardId: string | undefined): QueryContext {
	const statuses = useBoardStatuses(boardId);
	const priorities = useAppStore((state) => state.priorities);
	const users = useAppStore((state) => state.users);
	return useMemo(() => ({ statuses, priorities, users }), [statuses, priorities, users]);
}

export function taskKey(task: Task) {
	return `${task.boardKey}-${task.sequenceNumber}`;
}

export function initialsOf(user: User) {
	return user.displayName
		.split(" ")
		.map((part) => part[0])
		.slice(0, 2)
		.join("");
}

export function isOverdue(task: Task, doneStatusIds: Set<string>) {
	if (!task.endDate || doneStatusIds.has(task.statusId)) return false;
	return dayjs(task.endDate).isBefore(dayjs(), "day");
}
