export type StatusCategory = "to_do" | "in_progress" | "done";

export type PriorityKey = "urgent" | "high" | "medium" | "low" | "none";

export type BoardApp = "kanban" | "table";

export type GroupField = "status" | "assignee" | "priority" | "none";

export type SortField = "key" | "summary" | "status" | "priority" | "endDate" | "createdAt" | "updatedAt";

export type SortDirection = "asc" | "desc";

export type DueDatePreset = "any" | "overdue" | "today" | "this_week" | "this_month" | "no_date";

export type TaskField = "key" | "status" | "priority" | "assignees" | "dueDate" | "comments" | "description";

export type Density = "compact" | "comfortable";

export const UNASSIGNED = "unassigned";

export interface SortRule {
	field: SortField;
	direction: SortDirection;
}

export interface ViewFilters {
	search: string;
	assigneeIds: string[];
	priorityIds: string[];
	statusIds: string[];
	dueDate: DueDatePreset;
}

export interface ViewSettings {
	filters: ViewFilters;
	sorts: SortRule[];
	groupBy: GroupField;
	visibleFields: TaskField[];
	collapsedGroupIds: string[];
	columnLimits: Record<string, number>;
	density: Density;
	showEmptyGroups: boolean;
}

export interface TaskGroup {
	id: string;
	name: string;
	color: string;
	field: GroupField;
}

export interface Site {
	id: string;
	name: string;
	subdomain: string;
	icon: string;
}

export interface User {
	id: string;
	email: string;
	displayName: string;
	avatarColor: string;
}

export interface Board {
	id: string;
	siteId: string;
	key: string;
	name: string;
	description: string;
	color: string;
	starred: boolean;
	nextSequence: number;
}

export interface BoardStatus {
	id: string;
	boardId: string;
	name: string;
	color: string;
	statusCategory: StatusCategory;
	rank: number;
}

export interface BoardPriority {
	id: string;
	key: PriorityKey;
	name: string;
	color: string;
	rank: number;
}

export interface Task {
	id: string;
	boardId: string;
	boardKey: string;
	sequenceNumber: number;
	summary: string;
	description: string;
	statusId: string;
	priorityId: string;
	assigneeIds: string[];
	startDate: string | null;
	endDate: string | null;
	estimatedTime: number | null;
	rank: string;
	parentId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface TaskComment {
	id: string;
	taskId: string;
	authorId: string;
	content: string;
	createdAt: string;
}

export interface BoardView {
	id: string;
	boardId: string;
	app: BoardApp;
	name: string;
	rank: number;
}
