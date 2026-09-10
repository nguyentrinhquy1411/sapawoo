import type { TaskField, ViewSettings } from "@/types";

export const ALL_TASK_FIELDS: TaskField[] = [
	"key",
	"status",
	"priority",
	"assignees",
	"dueDate",
	"comments",
	"description",
];

export const TASK_FIELD_LABELS: Record<TaskField, string> = {
	key: "Key",
	status: "Status",
	priority: "Priority",
	assignees: "Assignees",
	dueDate: "Due date",
	comments: "Comments",
	description: "Description",
};

export const SORT_FIELD_LABELS: Record<string, string> = {
	key: "Key",
	summary: "Summary",
	status: "Status",
	priority: "Priority",
	endDate: "Due date",
	createdAt: "Created",
	updatedAt: "Updated",
};

export const GROUP_FIELD_LABELS: Record<string, string> = {
	status: "Status",
	assignee: "Assignee",
	priority: "Priority",
	none: "None",
};

export const DUE_DATE_LABELS: Record<string, string> = {
	any: "Any time",
	overdue: "Overdue",
	today: "Today",
	this_week: "This week",
	this_month: "This month",
	no_date: "No due date",
};

export function defaultViewSettings(app: "kanban" | "table"): ViewSettings {
	return {
		filters: { search: "", assigneeIds: [], priorityIds: [], statusIds: [], dueDate: "any" },
		sorts: [],
		groupBy: "status",
		visibleFields:
			app === "kanban"
				? ["key", "priority", "assignees", "dueDate", "comments"]
				: ["key", "status", "priority", "assignees", "dueDate"],
		collapsedGroupIds: [],
		columnLimits: {},
		density: "comfortable",
		showEmptyGroups: true,
	};
}

export function countActiveFilters(settings: ViewSettings) {
	const { filters } = settings;
	return (
		filters.assigneeIds.length +
		filters.priorityIds.length +
		filters.statusIds.length +
		(filters.dueDate === "any" ? 0 : 1)
	);
}
