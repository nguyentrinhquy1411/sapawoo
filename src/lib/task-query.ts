import dayjs from "dayjs";
import { sortByRank } from "@/lib/rank";
import {
	type BoardPriority,
	type BoardStatus,
	type DueDatePreset,
	type GroupField,
	type SortRule,
	type Task,
	type TaskGroup,
	UNASSIGNED,
	type User,
	type ViewFilters,
} from "@/types";

export interface QueryContext {
	statuses: BoardStatus[];
	priorities: BoardPriority[];
	users: User[];
}

function matchesDueDate(task: Task, preset: DueDatePreset, doneStatusIds: Set<string>) {
	if (preset === "any") return true;
	if (preset === "no_date") return !task.endDate;
	if (!task.endDate) return false;

	const due = dayjs(task.endDate);
	switch (preset) {
		case "overdue":
			return due.isBefore(dayjs(), "day") && !doneStatusIds.has(task.statusId);
		case "today":
			return due.isSame(dayjs(), "day");
		case "this_week":
			return due.isAfter(dayjs().startOf("week").subtract(1, "ms")) && due.isBefore(dayjs().endOf("week"));
		case "this_month":
			return due.isSame(dayjs(), "month");
		default:
			return true;
	}
}

export function filterTasks(tasks: Task[], filters: ViewFilters, context: QueryContext) {
	const search = filters.search.trim().toLowerCase();
	const doneStatusIds = new Set(
		context.statuses.filter((status) => status.statusCategory === "done").map((status) => status.id),
	);

	return tasks.filter((task) => {
		if (search) {
			const haystack = `${task.boardKey}-${task.sequenceNumber} ${task.summary} ${task.description}`;
			if (!haystack.toLowerCase().includes(search)) return false;
		}
		if (filters.statusIds.length && !filters.statusIds.includes(task.statusId)) return false;
		if (filters.priorityIds.length && !filters.priorityIds.includes(task.priorityId)) return false;
		if (filters.assigneeIds.length) {
			const wantsUnassigned = filters.assigneeIds.includes(UNASSIGNED);
			const matchesUser = task.assigneeIds.some((id) => filters.assigneeIds.includes(id));
			if (!(matchesUser || (wantsUnassigned && task.assigneeIds.length === 0))) return false;
		}
		if (!matchesDueDate(task, filters.dueDate, doneStatusIds)) return false;
		return true;
	});
}

function compareBy(rule: SortRule, context: QueryContext) {
	const statusRank = new Map(context.statuses.map((status) => [status.id, status.rank]));
	const priorityRank = new Map(context.priorities.map((priority) => [priority.id, priority.rank]));

	return (left: Task, right: Task) => {
		let result = 0;
		switch (rule.field) {
			case "key":
				result = left.sequenceNumber - right.sequenceNumber;
				break;
			case "summary":
				result = left.summary.localeCompare(right.summary);
				break;
			case "status":
				result = (statusRank.get(left.statusId) ?? 0) - (statusRank.get(right.statusId) ?? 0);
				break;
			case "priority":
				result = (priorityRank.get(left.priorityId) ?? 0) - (priorityRank.get(right.priorityId) ?? 0);
				break;
			case "endDate":
				result = (left.endDate ?? "9999").localeCompare(right.endDate ?? "9999");
				break;
			default:
				result = left[rule.field].localeCompare(right[rule.field]);
		}
		return rule.direction === "asc" ? result : -result;
	};
}

export function sortTasks(tasks: Task[], sorts: SortRule[], context: QueryContext) {
	if (sorts.length === 0) return sortByRank(tasks);

	const comparators = sorts.map((rule) => compareBy(rule, context));
	return [...tasks].sort((left, right) => {
		for (const comparator of comparators) {
			const result = comparator(left, right);
			if (result !== 0) return result;
		}
		return left.rank < right.rank ? -1 : 1;
	});
}

export function buildGroups(field: GroupField, context: QueryContext): TaskGroup[] {
	switch (field) {
		case "status":
			return [...context.statuses]
				.sort((a, b) => a.rank - b.rank)
				.map((status) => ({ id: status.id, name: status.name, color: status.color, field }));
		case "priority":
			return [...context.priorities]
				.sort((a, b) => a.rank - b.rank)
				.map((priority) => ({ id: priority.id, name: priority.name, color: priority.color, field }));
		case "assignee":
			return [
				...context.users.map((user) => ({
					id: user.id,
					name: user.displayName,
					color: user.avatarColor,
					field,
				})),
				{ id: UNASSIGNED, name: "Unassigned", color: "var(--color-muted-foreground)", field },
			];
		default:
			return [{ id: "all", name: "All tasks", color: "var(--color-primary)", field: "none" }];
	}
}

export function groupIdOf(task: Task, field: GroupField) {
	switch (field) {
		case "status":
			return task.statusId;
		case "priority":
			return task.priorityId;
		case "assignee":
			return task.assigneeIds[0] ?? UNASSIGNED;
		default:
			return "all";
	}
}

export function groupPatchFor(field: GroupField, groupId: string): Partial<Task> {
	switch (field) {
		case "status":
			return { statusId: groupId };
		case "priority":
			return { priorityId: groupId };
		case "assignee":
			return { assigneeIds: groupId === UNASSIGNED ? [] : [groupId] };
		default:
			return {};
	}
}

export interface GroupedTasks {
	group: TaskGroup;
	tasks: Task[];
}

export function groupTasks(
	tasks: Task[],
	groups: TaskGroup[],
	field: GroupField,
	sorts: SortRule[],
	context: QueryContext,
): GroupedTasks[] {
	const buckets = new Map<string, Task[]>(groups.map((group) => [group.id, []]));

	for (const task of tasks) {
		const key = groupIdOf(task, field);
		const bucket = buckets.get(key);
		if (bucket) bucket.push(task);
		else buckets.set(key, [task]);
	}

	return groups.map((group) => ({
		group,
		tasks: sortTasks(buckets.get(group.id) ?? [], sorts, context),
	}));
}
