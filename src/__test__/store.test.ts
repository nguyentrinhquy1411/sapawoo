import { beforeEach, expect, test } from "vitest";
import { between, sortByRank } from "@/lib/rank";
import { buildSeed } from "@/lib/seed";
import { useAppStore } from "@/store/use-app-store";

beforeEach(() => {
	useAppStore.setState(buildSeed());
});

test("between produces a rank strictly ordered between its neighbours", () => {
	const left = "i";
	const right = "j";
	const middle = between(left, right);
	expect(left < middle).toBe(true);
	expect(middle < right).toBe(true);
	expect(between(null, null) > "").toBe(true);
	expect(between("i", null) > "i").toBe(true);
	expect(between(null, "i") < "i").toBe(true);
});

test("createTask assigns the next sequence number of its board", () => {
	const board = useAppStore.getState().boards[0];
	const statusId = useAppStore.getState().statuses.find((status) => status.boardId === board.id)?.id ?? "";

	const created = useAppStore.getState().createTask({ boardId: board.id, statusId, summary: "New task" });

	expect(created?.sequenceNumber).toBe(board.nextSequence);
	expect(created?.boardKey).toBe(board.key);
	expect(useAppStore.getState().boards[0].nextSequence).toBe(board.nextSequence + 1);
});

test("rankTask moves a task to another status and keeps ranks ordered", () => {
	const state = useAppStore.getState();
	const board = state.boards[0];
	const [firstStatus, , thirdStatus] = state.statuses.filter((status) => status.boardId === board.id);
	const target = state.tasks.find((task) => task.statusId === firstStatus.id);
	if (!target) throw new Error("seed has no task in the first status");

	const destination = sortByRank(
		useAppStore.getState().tasks.filter((task) => task.statusId === thirdStatus.id),
	);

	useAppStore.getState().rankTask(
		target.id,
		{ statusId: thirdStatus.id },
		{ rankBeforeTaskId: destination[0]?.id ?? null, rankAfterTaskId: destination[1]?.id ?? null },
	);

	const moved = useAppStore.getState().tasks.find((task) => task.id === target.id);
	expect(moved?.statusId).toBe(thirdStatus.id);

	const column = sortByRank(
		useAppStore.getState().tasks.filter((task) => task.statusId === thirdStatus.id),
	);
	expect(column[1]?.id).toBe(target.id);
	expect(column.map((task) => task.rank)).toEqual([...column.map((task) => task.rank)].sort());
});

test("deleteTask removes the task and its comments", () => {
	const taskId = useAppStore.getState().comments[0].taskId;
	useAppStore.getState().deleteTask(taskId);

	expect(useAppStore.getState().tasks.some((task) => task.id === taskId)).toBe(false);
	expect(useAppStore.getState().comments.some((comment) => comment.taskId === taskId)).toBe(false);
});
