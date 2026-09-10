import { completeJson } from "@/lib/ai/groq";
import type { BoardPriority, BoardStatus, DueDatePreset, User, ViewFilters } from "@/types";
import { UNASSIGNED } from "@/types";

interface FilterAgentResponse {
	search?: string;
	statusNames?: string[];
	assigneeNames?: string[];
	priorityNames?: string[];
	dueDate?: DueDatePreset;
	explanation?: string;
}

const DUE_DATE_VALUES: DueDatePreset[] = ["any", "overdue", "today", "this_week", "this_month", "no_date"];

export interface FilterAgentContext {
	statuses: BoardStatus[];
	priorities: BoardPriority[];
	users: User[];
}

export interface FilterAgentResult {
	filters: Partial<ViewFilters>;
	explanation: string;
}

export async function runFilterAgent(
	query: string,
	{ statuses, priorities, users }: FilterAgentContext,
	signal?: AbortSignal,
): Promise<FilterAgentResult> {
	const response = await completeJson<FilterAgentResponse>(
		[
			{
				role: "system",
				content: `Turn a plain-language request into board filters for a work management app.
Return JSON with these optional keys: search (string), statusNames (string[]), assigneeNames (string[]), priorityNames (string[]), dueDate (one of ${DUE_DATE_VALUES.join(", ")}), explanation (one short sentence).
Only use names from these lists.
Statuses: ${statuses.map((status) => status.name).join(", ")}
Priorities: ${priorities.map((priority) => priority.name).join(", ")}
Members: ${users.map((user) => user.displayName).join(", ")}, Unassigned
Use search only for free text that is not a status, priority, member or date. Leave a key out when it does not apply.`,
			},
			{ role: "user", content: query },
		],
		signal,
	);

	const matchIds = <T extends { id: string }>(items: T[], names: string[] | undefined, label: (item: T) => string) =>
		(names ?? [])
			.map((name) => items.find((item) => label(item).toLowerCase() === name.trim().toLowerCase())?.id)
			.filter((id): id is string => Boolean(id));

	const assigneeIds = matchIds(users, response.assigneeNames, (user) => user.displayName);
	if (response.assigneeNames?.some((name) => name.trim().toLowerCase() === "unassigned")) {
		assigneeIds.push(UNASSIGNED);
	}

	return {
		filters: {
			search: response.search ?? "",
			statusIds: matchIds(statuses, response.statusNames, (status) => status.name),
			priorityIds: matchIds(priorities, response.priorityNames, (priority) => priority.name),
			assigneeIds,
			dueDate: DUE_DATE_VALUES.includes(response.dueDate as DueDatePreset)
				? (response.dueDate as DueDatePreset)
				: "any",
		},
		explanation: response.explanation ?? "",
	};
}
