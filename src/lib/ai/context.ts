import dayjs from "dayjs";
import { taskKey } from "@/store/selectors";
import type { Board, BoardPriority, BoardStatus, Task, User } from "@/types";

export interface BoardContext {
	board: Board;
	statuses: BoardStatus[];
	priorities: BoardPriority[];
	users: User[];
	tasks: Task[];
}

export function serializeBoard({ board, statuses, priorities, users, tasks }: BoardContext) {
	const statusName = (id: string) => statuses.find((status) => status.id === id)?.name ?? "Unknown";
	const priorityName = (id: string) => priorities.find((priority) => priority.id === id)?.name ?? "None";
	const userName = (id: string) => users.find((user) => user.id === id)?.displayName ?? id;

	const lines = tasks.map((task) => {
		const assignees = task.assigneeIds.map(userName).join(", ") || "Unassigned";
		const due = task.endDate ? dayjs(task.endDate).format("YYYY-MM-DD") : "no due date";
		return `- ${taskKey(task)} | ${task.summary} | status: ${statusName(task.statusId)} | priority: ${priorityName(task.priorityId)} | assignees: ${assignees} | due: ${due}`;
	});

	return [
		`Board: ${board.name} (${board.key}) — ${board.description || "no description"}`,
		`Today: ${dayjs().format("YYYY-MM-DD")}`,
		`Statuses: ${statuses.map((status) => status.name).join(" → ")}`,
		`Members: ${users.map((user) => user.displayName).join(", ")}`,
		`Tasks (${tasks.length}):`,
		...lines,
	].join("\n");
}

export const ASSISTANT_SYSTEM_PROMPT = `You are ORIN, the assistant inside Sapawoo, a work management app.
You help the user reason about their board: risks, blockers, overdue work, ownership gaps, sprint planning and status updates.

Rules:
- Be concise and concrete. Prefer short paragraphs and tight bullet lists.
- Refer to tasks by their key (e.g. ENG-3) so the user can find them.
- Only use the board data given to you. If something is not in the data, say so instead of inventing it.
- When the user asks you to change the board (create, update or delete tasks), do not claim you did it.
  Instead, end your reply with a single fenced code block tagged sapawoo-actions containing JSON:
  {"actions":[{"type":"create_task","summary":"...","statusName":"...","priorityName":"...","assigneeName":"...","dueDate":"YYYY-MM-DD"},
              {"type":"update_task","taskKey":"ENG-3","statusName":"...","priorityName":"...","assigneeName":"...","dueDate":"YYYY-MM-DD","summary":"..."},
              {"type":"delete_task","taskKey":"ENG-4"}]}
  Every field except type is optional. The user reviews and applies the actions themselves.`;
