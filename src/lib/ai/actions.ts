import dayjs from "dayjs";
import type { BoardContext } from "@/lib/ai/context";
import type { Task } from "@/types";

export interface ProposedAction {
	type: "create_task" | "update_task" | "delete_task";
	taskKey?: string;
	summary?: string;
	statusName?: string;
	priorityName?: string;
	assigneeName?: string;
	dueDate?: string;
}

const ACTION_BLOCK = /```sapawoo-actions\s*([\s\S]*?)```/;

export function extractActions(content: string): { text: string; actions: ProposedAction[] } {
	const match = content.match(ACTION_BLOCK);
	if (!match) return { text: content, actions: [] };

	const text = content.replace(ACTION_BLOCK, "").trim();
	try {
		const parsed = JSON.parse(match[1]) as { actions?: ProposedAction[] };
		const actions = (parsed.actions ?? []).filter((action) =>
			["create_task", "update_task", "delete_task"].includes(action.type),
		);
		return { text, actions };
	} catch {
		return { text, actions: [] };
	}
}

function findByName<T extends { name?: string; displayName?: string; id: string }>(
	items: T[],
	name: string | undefined,
) {
	if (!name) return undefined;
	const needle = name.trim().toLowerCase();
	return items.find((item) => (item.name ?? item.displayName ?? "").toLowerCase() === needle);
}

export function findTaskByKey(tasks: Task[], key: string | undefined) {
	if (!key) return undefined;
	const needle = key.trim().toUpperCase();
	return tasks.find((task) => `${task.boardKey}-${task.sequenceNumber}`.toUpperCase() === needle);
}

export function describeAction(action: ProposedAction) {
	const details = [
		action.statusName && `status ${action.statusName}`,
		action.priorityName && `priority ${action.priorityName}`,
		action.assigneeName && `assigned to ${action.assigneeName}`,
		action.dueDate && `due ${action.dueDate}`,
	]
		.filter(Boolean)
		.join(", ");

	switch (action.type) {
		case "create_task":
			return { title: action.summary ?? "New task", detail: details || "no extra fields" };
		case "update_task":
			return { title: `${action.taskKey ?? "task"} — ${action.summary ?? "update"}`, detail: details };
		default:
			return { title: `Delete ${action.taskKey ?? "task"}`, detail: "" };
	}
}

export interface ActionHandlers {
	createTask: (input: { boardId: string; statusId: string; summary: string }) => Task | undefined;
	updateTask: (taskId: string, patch: Partial<Task>) => void;
	deleteTask: (taskId: string) => void;
}

export function applyActions(
	actions: ProposedAction[],
	context: BoardContext,
	handlers: ActionHandlers,
) {
	const { board, statuses, priorities, users, tasks } = context;
	let applied = 0;

	for (const action of actions) {
		const status = findByName(statuses, action.statusName);
		const priority = findByName(priorities, action.priorityName);
		const assignee = findByName(users, action.assigneeName);
		const dueDate = action.dueDate && dayjs(action.dueDate).isValid()
			? dayjs(action.dueDate).toISOString()
			: undefined;

		if (action.type === "create_task") {
			const statusId = status?.id ?? statuses[0]?.id;
			if (!statusId || !action.summary) continue;

			const created = handlers.createTask({ boardId: board.id, statusId, summary: action.summary });
			if (!created) continue;

			const patch: Partial<Task> = {};
			if (priority) patch.priorityId = priority.id;
			if (assignee) patch.assigneeIds = [assignee.id];
			if (dueDate) patch.endDate = dueDate;
			if (Object.keys(patch).length > 0) handlers.updateTask(created.id, patch);
			applied += 1;
			continue;
		}

		const target = findTaskByKey(tasks, action.taskKey);
		if (!target) continue;

		if (action.type === "delete_task") {
			handlers.deleteTask(target.id);
			applied += 1;
			continue;
		}

		const patch: Partial<Task> = {};
		if (action.summary) patch.summary = action.summary;
		if (status) patch.statusId = status.id;
		if (priority) patch.priorityId = priority.id;
		if (assignee) patch.assigneeIds = [assignee.id];
		if (dueDate) patch.endDate = dueDate;
		if (Object.keys(patch).length > 0) {
			handlers.updateTask(target.id, patch);
			applied += 1;
		}
	}

	return applied;
}
