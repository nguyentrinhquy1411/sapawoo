import dayjs from "dayjs";
import { expect, test } from "vitest";
import { applyActions, extractActions } from "@/lib/ai/actions";
import { buildSeed } from "@/lib/seed";
import { useAppStore } from "@/store/use-app-store";

function boardContext() {
	const seed = buildSeed();
	useAppStore.setState({ ...seed, viewSettings: {} });
	const board = seed.boards[0];
	return {
		board,
		statuses: seed.statuses.filter((status) => status.boardId === board.id),
		priorities: seed.priorities,
		users: seed.users,
		tasks: seed.tasks.filter((task) => task.boardId === board.id),
	};
}

test("action blocks are stripped from the reply and parsed", () => {
	const reply = [
		"Here is what I would change:",
		"",
		"```sapawoo-actions",
		'{"actions":[{"type":"create_task","summary":"Write the runbook","statusName":"To Do"}]}',
		"```",
	].join("\n");

	const { text, actions } = extractActions(reply);

	expect(text).toBe("Here is what I would change:");
	expect(actions).toHaveLength(1);
	expect(actions[0]).toMatchObject({ type: "create_task", summary: "Write the runbook" });
});

test("a malformed action block leaves the reply readable", () => {
	const { text, actions } = extractActions("Sure.\n```sapawoo-actions\nnot json\n```");
	expect(text).toBe("Sure.");
	expect(actions).toEqual([]);
});

test("applying actions creates and updates real tasks", () => {
	const context = boardContext();
	const store = useAppStore.getState();
	const target = context.tasks[0];

	const applied = applyActions(
		[
			{
				type: "create_task",
				summary: "Write the runbook",
				statusName: "In Progress",
				priorityName: "High",
				assigneeName: context.users[1].displayName,
				dueDate: "2026-01-15",
			},
			{ type: "update_task", taskKey: `${target.boardKey}-${target.sequenceNumber}`, statusName: "Done" },
		],
		context,
		{
			createTask: store.createTask,
			updateTask: store.updateTask,
			deleteTask: store.deleteTask,
		},
	);

	const state = useAppStore.getState();
	const created = state.tasks.find((task) => task.summary === "Write the runbook");
	const doneStatus = context.statuses.find((status) => status.name === "Done");

	expect(applied).toBe(2);
	expect(created?.assigneeIds).toEqual([context.users[1].id]);
	expect(dayjs(created?.endDate).format("YYYY-MM-DD")).toBe("2026-01-15");
	expect(state.tasks.find((task) => task.id === target.id)?.statusId).toBe(doneStatus?.id);
});
