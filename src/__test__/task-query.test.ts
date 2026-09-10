import dayjs from "dayjs";
import { expect, test } from "vitest";
import { buildGroups, filterTasks, groupIdOf, groupPatchFor, groupTasks, sortTasks } from "@/lib/task-query";
import { PRIORITIES, USERS, buildSeed } from "@/lib/seed";
import { defaultViewSettings } from "@/lib/view-settings";
import { UNASSIGNED, type Task } from "@/types";

function context() {
	const seed = buildSeed();
	const board = seed.boards[0];
	return {
		seed,
		board,
		query: {
			statuses: seed.statuses.filter((status) => status.boardId === board.id),
			priorities: seed.priorities,
			users: seed.users,
		},
		tasks: seed.tasks.filter((task) => task.boardId === board.id),
	};
}

test("search matches key and summary", () => {
	const { query, tasks } = context();
	const filters = { ...defaultViewSettings("table").filters, search: "eng-2" };
	expect(filterTasks(tasks, filters, query)).toHaveLength(1);

	const bySummary = filterTasks(tasks, { ...filters, search: "lexorank" }, query);
	expect(bySummary[0].summary).toContain("LexoRank");
});

test("assignee filter supports the unassigned bucket", () => {
	const { query, tasks } = context();
	const base = defaultViewSettings("table").filters;

	const forUser = filterTasks(tasks, { ...base, assigneeIds: [USERS[0].id] }, query);
	expect(forUser.every((task) => task.assigneeIds.includes(USERS[0].id))).toBe(true);

	const unassignedTask: Task = { ...tasks[0], id: "task-x", assigneeIds: [] };
	const unassigned = filterTasks([...tasks, unassignedTask], { ...base, assigneeIds: [UNASSIGNED] }, query);
	expect(unassigned.map((task) => task.id)).toContain("task-x");
});

test("due date presets narrow to the expected window", () => {
	const { query, tasks } = context();
	const base = defaultViewSettings("table").filters;
	const doneIds = new Set(
		query.statuses.filter((status) => status.statusCategory === "done").map((status) => status.id),
	);

	const overdue = filterTasks(tasks, { ...base, dueDate: "overdue" }, query);
	expect(
		overdue.every(
			(task) => dayjs(task.endDate).isBefore(dayjs(), "day") && !doneIds.has(task.statusId),
		),
	).toBe(true);

	const noDate = filterTasks([...tasks, { ...tasks[0], id: "no-date", endDate: null }], { ...base, dueDate: "no_date" }, query);
	expect(noDate.map((task) => task.id)).toEqual(["no-date"]);
});

test("filters combine with AND across fields", () => {
	const { query, tasks } = context();
	const base = defaultViewSettings("table").filters;
	const statusId = query.statuses[2].id;

	const combined = filterTasks(
		tasks,
		{ ...base, statusIds: [statusId], priorityIds: [PRIORITIES[3].id] },
		query,
	);
	expect(combined.every((task) => task.statusId === statusId && task.priorityId === PRIORITIES[3].id)).toBe(true);
});

test("sorting by priority then key is stable and reversible", () => {
	const { query, tasks } = context();
	const ascending = sortTasks(tasks, [{ field: "priority", direction: "asc" }], query);
	const descending = sortTasks(tasks, [{ field: "priority", direction: "desc" }], query);

	const rankOf = (task: Task) => query.priorities.find((item) => item.id === task.priorityId)?.rank ?? 0;
	expect(rankOf(ascending[0])).toBeLessThanOrEqual(rankOf(ascending.at(-1) as Task));
	expect(rankOf(descending[0])).toBeGreaterThanOrEqual(rankOf(descending.at(-1) as Task));
});

test("grouping by assignee puts unassigned tasks in their own bucket", () => {
	const { query, tasks } = context();
	const groups = buildGroups("assignee", query);
	const unassignedTask: Task = { ...tasks[0], id: "solo", assigneeIds: [] };

	const grouped = groupTasks([...tasks, unassignedTask], groups, "assignee", [], query);
	const bucket = grouped.find((entry) => entry.group.id === UNASSIGNED);

	expect(groupIdOf(unassignedTask, "assignee")).toBe(UNASSIGNED);
	expect(bucket?.tasks.map((task) => task.id)).toContain("solo");
});

test("group patches map a drop target back onto the task field", () => {
	expect(groupPatchFor("status", "status-1")).toEqual({ statusId: "status-1" });
	expect(groupPatchFor("priority", "prio-high")).toEqual({ priorityId: "prio-high" });
	expect(groupPatchFor("assignee", "user-2")).toEqual({ assigneeIds: ["user-2"] });
	expect(groupPatchFor("assignee", UNASSIGNED)).toEqual({ assigneeIds: [] });
});

test("drop neighbours resolve from the target row and its closest edge", async () => {
	const { neighboursForDrop } = await import("@/lib/dnd");
	const { tasks } = context();
	const [first, second, third] = tasks;

	expect(neighboursForDrop(tasks, third.id, second.id, "top")).toEqual({
		rankBeforeTaskId: first.id,
		rankAfterTaskId: second.id,
	});
	expect(neighboursForDrop(tasks, third.id, second.id, "bottom")).toEqual({
		rankBeforeTaskId: second.id,
		rankAfterTaskId: tasks[3].id,
	});
	expect(neighboursForDrop(tasks, first.id, null, null).rankAfterTaskId).toBeNull();
});
