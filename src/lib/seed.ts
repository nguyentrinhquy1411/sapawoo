import dayjs from "dayjs";
import { after, first } from "@/lib/rank";
import type {
	Board,
	BoardPriority,
	BoardStatus,
	BoardView,
	Site,
	Task,
	TaskComment,
	User,
} from "@/types";

export const PRIORITIES: BoardPriority[] = [
	{ id: "prio-urgent", key: "urgent", name: "Urgent", color: "var(--color-destructive)", rank: 1 },
	{ id: "prio-high", key: "high", name: "High", color: "var(--color-chart-4)", rank: 2 },
	{ id: "prio-medium", key: "medium", name: "Medium", color: "var(--color-chart-2)", rank: 3 },
	{ id: "prio-low", key: "low", name: "Low", color: "var(--color-chart-5)", rank: 4 },
	{ id: "prio-none", key: "none", name: "No priority", color: "var(--color-muted-foreground)", rank: 5 },
];

const STATUS_TEMPLATE: Array<Pick<BoardStatus, "name" | "color" | "statusCategory">> = [
	{ name: "Backlog", color: "var(--color-muted-foreground)", statusCategory: "to_do" },
	{ name: "To Do", color: "var(--color-chart-5)", statusCategory: "to_do" },
	{ name: "In Progress", color: "var(--color-primary)", statusCategory: "in_progress" },
	{ name: "In Review", color: "var(--color-chart-3)", statusCategory: "in_progress" },
	{ name: "Done", color: "var(--color-chart-1)", statusCategory: "done" },
];

export const SITE: Site = {
	id: "site-1",
	name: "Sapawoo",
	subdomain: "sapawoo",
	icon: "SW",
};

export const USERS: User[] = [
	{ id: "user-1", email: "quy.nguyen@sapawoo.com", displayName: "Quy Nguyen", avatarColor: "var(--color-chart-5)" },
	{ id: "user-2", email: "an.tran@sapawoo.com", displayName: "An Tran", avatarColor: "var(--color-chart-1)" },
	{ id: "user-3", email: "bao.le@sapawoo.com", displayName: "Bao Le", avatarColor: "var(--color-chart-3)" },
	{ id: "user-4", email: "chi.pham@sapawoo.com", displayName: "Chi Pham", avatarColor: "var(--color-chart-4)" },
	{ id: "user-5", email: "dung.vo@sapawoo.com", displayName: "Dung Vo", avatarColor: "var(--color-chart-2)" },
];

const BOARD_TEMPLATE = [
	{
		key: "ENG",
		name: "Engineering",
		description: "Platform work for the core API and web app",
		color: "var(--color-primary)",
		starred: true,
		summaries: [
			["Set up cursor pagination for task search", 2, ["user-1"], 4, 8],
			["Kanban drag & drop drops task on wrong column", 0, ["user-2"], 1, 3],
			["Add LexoRank rebalance job", 0, ["user-1", "user-3"], 3, 13],
			["Migrate board statuses to site-level statuses", 1, ["user-3"], 2, 5],
			["Task detail dialog keyboard navigation", 2, ["user-2"], 3, 5],
			["Cache invalidation on task update", 3, ["user-1"], 1, 2],
			["Custom field values typed columns", 1, ["user-4"], 2, 8],
			["Reduce bundle size of table view", 4, ["user-5"], 4, -2],
			["Board view user preferences endpoint", 4, ["user-3"], 3, -5],
			["Fix N+1 query on board metadata", 2, ["user-1"], 0, 1],
			["Sync endpoint returns deleted tasks", 1, ["user-2"], 1, 6],
		],
	},
	{
		key: "MKT",
		name: "Marketing",
		description: "Campaigns, launches and content calendar",
		color: "var(--color-chart-3)",
		starred: true,
		summaries: [
			["Q3 launch landing page copy", 2, ["user-4"], 2, 4],
			["Webinar: work management for dev teams", 1, ["user-4", "user-5"], 3, 10],
			["Refresh pricing page screenshots", 0, ["user-5"], 4, 14],
			["Case study with pilot customer", 3, ["user-4"], 1, 2],
			["Email nurture sequence rewrite", 4, ["user-5"], 3, -3],
			["SEO audit for docs site", 0, [], 4, 21],
			["Product hunt launch checklist", 2, ["user-4"], 0, 1],
		],
	},
	{
		key: "DSN",
		name: "Design",
		description: "Design system and product surfaces",
		color: "var(--color-chart-1)",
		starred: false,
		summaries: [
			["Kanban card density options", 2, ["user-3"], 2, 3],
			["Dark theme token audit", 1, ["user-3"], 1, 7],
			["Empty states for every view", 0, ["user-2"], 3, 12],
			["Task detail layout exploration", 3, ["user-3"], 0, 1],
			["Icon set consolidation", 4, ["user-2"], 4, -8],
			["Sidebar navigation redesign", 2, ["user-3", "user-2"], 1, 5],
		],
	},
] as const;

const COMMENT_SEEDS: Array<[number, string, string]> = [
	[0, "user-2", "Cursor pagination is in, but we still need a stable tiebreaker on rank."],
	[0, "user-1", "Added (rank, id) as the composite cursor. Ready for review."],
	[1, "user-1", "Reproduced: happens when dropping on a collapsed column header."],
	[2, "user-3", "Threshold of 24 chars matches the API side, let's keep it consistent."],
];

export function buildSeed() {
	const boards: Board[] = [];
	const statuses: BoardStatus[] = [];
	const views: BoardView[] = [];
	const tasks: Task[] = [];
	const comments: TaskComment[] = [];
	const now = dayjs();

	BOARD_TEMPLATE.forEach((template, boardIndex) => {
		const boardId = `board-${boardIndex + 1}`;
		const boardStatuses = STATUS_TEMPLATE.map((status, statusIndex) => ({
			id: `${boardId}-status-${statusIndex + 1}`,
			boardId,
			rank: statusIndex + 1,
			...status,
		}));
		statuses.push(...boardStatuses);

		views.push(
			{ id: `${boardId}-view-kanban`, boardId, app: "kanban", name: "Board", rank: 1 },
			{ id: `${boardId}-view-table`, boardId, app: "table", name: "Table", rank: 2 },
		);

		const rankPerStatus = new Map<string, string>();
		template.summaries.forEach(([summary, statusIndex, assigneeIds, priorityIndex, dueOffset], taskIndex) => {
			const status = boardStatuses[statusIndex as number];
			const previousRank = rankPerStatus.get(status.id);
			const rank = previousRank ? after(previousRank) : first();
			rankPerStatus.set(status.id, rank);

			const createdAt = now.subtract(template.summaries.length - taskIndex, "day");
			tasks.push({
				id: `${boardId}-task-${taskIndex + 1}`,
				boardId,
				boardKey: template.key,
				sequenceNumber: taskIndex + 1,
				summary: summary as string,
				description:
					status.statusCategory === "done"
						? "Shipped. Follow-up items tracked separately."
						: "Add context, acceptance criteria and links here.",
				statusId: status.id,
				priorityId: PRIORITIES[priorityIndex as number].id,
				assigneeIds: [...(assigneeIds as readonly string[])],
				startDate: null,
				endDate: now.add(dueOffset as number, "day").toISOString(),
				estimatedTime: null,
				rank,
				parentId: null,
				createdAt: createdAt.toISOString(),
				updatedAt: createdAt.toISOString(),
			});
		});

		boards.push({
			id: boardId,
			siteId: SITE.id,
			key: template.key,
			name: template.name,
			description: template.description,
			color: template.color,
			starred: template.starred,
			nextSequence: template.summaries.length + 1,
		});
	});

	COMMENT_SEEDS.forEach(([taskIndex, authorId, content], index) => {
		comments.push({
			id: `comment-${index + 1}`,
			taskId: tasks[taskIndex].id,
			authorId,
			content,
			createdAt: now.subtract(COMMENT_SEEDS.length - index, "hour").toISOString(),
		});
	});

	return { site: SITE, users: USERS, boards, statuses, priorities: PRIORITIES, views, tasks, comments };
}
