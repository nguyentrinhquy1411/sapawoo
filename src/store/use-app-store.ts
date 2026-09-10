import { create } from "zustand";
import { persist } from "zustand/middleware";
import { between, first, sortByRank } from "@/lib/rank";
import { buildSeed } from "@/lib/seed";
import { defaultViewSettings } from "@/lib/view-settings";
import type {
	Board,
	BoardPriority,
	BoardStatus,
	BoardView,
	Site,
	StatusCategory,
	Task,
	TaskComment,
	User,
	ViewSettings,
} from "@/types";

interface RankTarget {
	rankBeforeTaskId?: string | null;
	rankAfterTaskId?: string | null;
}

interface AppState {
	site: Site;
	users: User[];
	boards: Board[];
	statuses: BoardStatus[];
	priorities: BoardPriority[];
	views: BoardView[];
	tasks: Task[];
	comments: TaskComment[];
	viewSettings: Record<string, ViewSettings>;

	createTask: (input: { boardId: string; statusId: string; summary: string; atTop?: boolean }) => Task | undefined;
	updateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "boardId" | "boardKey">>) => void;
	updateTasks: (taskIds: string[], patch: Partial<Omit<Task, "id" | "boardId" | "boardKey">>) => void;
	setAssignees: (taskId: string, assigneeIds: string[]) => void;
	deleteTask: (taskId: string) => void;
	deleteTasks: (taskIds: string[]) => void;
	duplicateTask: (taskId: string) => void;
	rankTask: (taskId: string, patch: Partial<Task>, target: RankTarget) => void;
	addComment: (taskId: string, authorId: string, content: string) => void;

	updateSite: (patch: Partial<Omit<Site, "id">>) => void;
	toggleStar: (boardId: string) => void;
	createBoard: (input: { key: string; name: string; description: string }) => void;
	updateBoard: (boardId: string, patch: Partial<Omit<Board, "id" | "siteId">>) => void;
	deleteBoard: (boardId: string) => void;

	createStatus: (boardId: string, input: { name: string; statusCategory: StatusCategory }) => void;
	updateStatus: (statusId: string, patch: Partial<Omit<BoardStatus, "id" | "boardId">>) => void;
	moveStatus: (statusId: string, direction: -1 | 1) => void;
	reorderStatuses: (boardId: string, orderedStatusIds: string[]) => void;
	deleteStatus: (statusId: string, reassignToStatusId: string) => void;

	getViewSettings: (viewId: string, app: "kanban" | "table") => ViewSettings;
	updateViewSettings: (viewId: string, app: "kanban" | "table", patch: Partial<ViewSettings>) => void;
	resetToSeed: () => void;
}

const nowIso = () => new Date().toISOString();

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const STATUS_TEMPLATES = [
	{ name: "Backlog", color: "var(--color-muted-foreground)", statusCategory: "to_do" as const },
	{ name: "To Do", color: "var(--color-chart-5)", statusCategory: "to_do" as const },
	{ name: "In Progress", color: "var(--color-primary)", statusCategory: "in_progress" as const },
	{ name: "In Review", color: "var(--color-chart-3)", statusCategory: "in_progress" as const },
	{ name: "Done", color: "var(--color-chart-1)", statusCategory: "done" as const },
];

export const useAppStore = create<AppState>()(
	persist(
		(set, get) => ({
			...buildSeed(),
			viewSettings: {},

			createTask: ({ boardId, statusId, summary, atTop }) => {
				const board = get().boards.find((item) => item.id === boardId);
				if (!board) return undefined;

				const siblings = sortByRank(get().tasks.filter((task) => task.statusId === statusId));
				const neighbourRank = atTop ? siblings.at(0)?.rank : siblings.at(-1)?.rank;
				const noPriority = get().priorities.find((priority) => priority.key === "none");
				const timestamp = nowIso();

				const task: Task = {
					id: randomId("task"),
					boardId,
					boardKey: board.key,
					sequenceNumber: board.nextSequence,
					summary,
					description: "",
					statusId,
					priorityId: noPriority?.id ?? get().priorities[0].id,
					assigneeIds: [],
					startDate: null,
					endDate: null,
					estimatedTime: null,
					rank: neighbourRank
						? atTop
							? between(null, neighbourRank)
							: between(neighbourRank, null)
						: first(),
					parentId: null,
					createdAt: timestamp,
					updatedAt: timestamp,
				};

				set((state) => ({
					tasks: [...state.tasks, task],
					boards: state.boards.map((item) =>
						item.id === boardId ? { ...item, nextSequence: item.nextSequence + 1 } : item,
					),
				}));

				return task;
			},

			updateTask: (taskId, patch) => get().updateTasks([taskId], patch),

			updateTasks: (taskIds, patch) =>
				set((state) => ({
					tasks: state.tasks.map((task) =>
						taskIds.includes(task.id) ? { ...task, ...patch, updatedAt: nowIso() } : task,
					),
				})),

			setAssignees: (taskId, assigneeIds) => get().updateTasks([taskId], { assigneeIds }),

			deleteTask: (taskId) => get().deleteTasks([taskId]),

			deleteTasks: (taskIds) =>
				set((state) => ({
					tasks: state.tasks.filter((task) => !taskIds.includes(task.id)),
					comments: state.comments.filter((comment) => !taskIds.includes(comment.taskId)),
				})),

			duplicateTask: (taskId) => {
				const source = get().tasks.find((task) => task.id === taskId);
				const board = get().boards.find((item) => item.id === source?.boardId);
				if (!source || !board) return;

				const timestamp = nowIso();
				set((state) => ({
					tasks: [
						...state.tasks,
						{
							...source,
							id: randomId("task"),
							sequenceNumber: board.nextSequence,
							summary: `${source.summary} (copy)`,
							rank: between(source.rank, null),
							createdAt: timestamp,
							updatedAt: timestamp,
						},
					],
					boards: state.boards.map((item) =>
						item.id === board.id ? { ...item, nextSequence: item.nextSequence + 1 } : item,
					),
				}));
			},

			rankTask: (taskId, patch, { rankBeforeTaskId, rankAfterTaskId }) => {
				const tasks = get().tasks;
				const beforeRank = tasks.find((task) => task.id === rankBeforeTaskId)?.rank ?? null;
				const afterRank = tasks.find((task) => task.id === rankAfterTaskId)?.rank ?? null;
				const rank = between(beforeRank, afterRank);

				set((state) => ({
					tasks: state.tasks.map((task) =>
						task.id === taskId ? { ...task, ...patch, rank, updatedAt: nowIso() } : task,
					),
				}));
			},

			addComment: (taskId, authorId, content) =>
				set((state) => ({
					comments: [
						...state.comments,
						{ id: randomId("comment"), taskId, authorId, content, createdAt: nowIso() },
					],
				})),

			updateSite: (patch) => set((state) => ({ site: { ...state.site, ...patch } })),

			toggleStar: (boardId) =>
				set((state) => ({
					boards: state.boards.map((board) =>
						board.id === boardId ? { ...board, starred: !board.starred } : board,
					),
				})),

			createBoard: ({ key, name, description }) => {
				const boardId = randomId("board");

				set((state) => ({
					boards: [
						...state.boards,
						{
							id: boardId,
							siteId: state.site.id,
							key: key.toUpperCase(),
							name,
							description,
							color: "var(--color-primary)",
							starred: false,
							nextSequence: 1,
						},
					],
					statuses: [
						...state.statuses,
						...STATUS_TEMPLATES.map((template, index) => ({
							id: `${boardId}-status-${index + 1}`,
							boardId,
							rank: index + 1,
							...template,
						})),
					],
					views: [
						...state.views,
						{ id: `${boardId}-view-kanban`, boardId, app: "kanban" as const, name: "Board", rank: 1 },
						{ id: `${boardId}-view-table`, boardId, app: "table" as const, name: "Table", rank: 2 },
					],
				}));
			},

			updateBoard: (boardId, patch) =>
				set((state) => ({
					boards: state.boards.map((board) => (board.id === boardId ? { ...board, ...patch } : board)),
					tasks: patch.key
						? state.tasks.map((task) =>
								task.boardId === boardId ? { ...task, boardKey: patch.key as string } : task,
							)
						: state.tasks,
				})),

			deleteBoard: (boardId) =>
				set((state) => {
					const taskIds = state.tasks.filter((task) => task.boardId === boardId).map((task) => task.id);
					return {
						boards: state.boards.filter((board) => board.id !== boardId),
						statuses: state.statuses.filter((status) => status.boardId !== boardId),
						views: state.views.filter((view) => view.boardId !== boardId),
						tasks: state.tasks.filter((task) => task.boardId !== boardId),
						comments: state.comments.filter((comment) => !taskIds.includes(comment.taskId)),
					};
				}),

			createStatus: (boardId, { name, statusCategory }) =>
				set((state) => {
					const boardStatuses = state.statuses.filter((status) => status.boardId === boardId);
					const rank = Math.max(0, ...boardStatuses.map((status) => status.rank)) + 1;
					return {
						statuses: [
							...state.statuses,
							{
								id: randomId("status"),
								boardId,
								name,
								statusCategory,
								color: "var(--color-chart-5)",
								rank,
							},
						],
					};
				}),

			updateStatus: (statusId, patch) =>
				set((state) => ({
					statuses: state.statuses.map((status) =>
						status.id === statusId ? { ...status, ...patch } : status,
					),
				})),

			moveStatus: (statusId, direction) =>
				set((state) => {
					const status = state.statuses.find((item) => item.id === statusId);
					if (!status) return {};

					const siblings = state.statuses
						.filter((item) => item.boardId === status.boardId)
						.sort((a, b) => a.rank - b.rank);
					const index = siblings.findIndex((item) => item.id === statusId);
					const swapWith = siblings[index + direction];
					if (!swapWith) return {};

					return {
						statuses: state.statuses.map((item) => {
							if (item.id === status.id) return { ...item, rank: swapWith.rank };
							if (item.id === swapWith.id) return { ...item, rank: status.rank };
							return item;
						}),
					};
				}),

			reorderStatuses: (boardId, orderedStatusIds) =>
				set((state) => ({
					statuses: state.statuses.map((status) => {
						if (status.boardId !== boardId) return status;
						const index = orderedStatusIds.indexOf(status.id);
						return index === -1 ? status : { ...status, rank: index + 1 };
					}),
				})),

			deleteStatus: (statusId, reassignToStatusId) =>
				set((state) => ({
					statuses: state.statuses.filter((status) => status.id !== statusId),
					tasks: state.tasks.map((task) =>
						task.statusId === statusId ? { ...task, statusId: reassignToStatusId } : task,
					),
				})),

			getViewSettings: (viewId, app) => get().viewSettings[viewId] ?? defaultViewSettings(app),

			updateViewSettings: (viewId, app, patch) =>
				set((state) => ({
					viewSettings: {
						...state.viewSettings,
						[viewId]: { ...(state.viewSettings[viewId] ?? defaultViewSettings(app)), ...patch },
					},
				})),

			resetToSeed: () => set({ ...buildSeed(), viewSettings: {} }),
		}),
		{
			name: "sapawoo",
			version: 3,
			migrate: (persisted, version) => (version < 3 ? { ...buildSeed(), viewSettings: {} } : persisted),
		},
	),
);
