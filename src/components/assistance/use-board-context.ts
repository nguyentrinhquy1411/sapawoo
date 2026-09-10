import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import type { BoardContext } from "@/lib/ai/context";
import { useAppStore } from "@/store/use-app-store";

export function useCurrentBoardContext(): BoardContext | null {
	const params = useParams({ strict: false }) as { boardKey?: string };
	const boards = useAppStore((state) => state.boards);
	const statuses = useAppStore((state) => state.statuses);
	const priorities = useAppStore((state) => state.priorities);
	const users = useAppStore((state) => state.users);
	const tasks = useAppStore((state) => state.tasks);

	return useMemo(() => {
		const board = params.boardKey
			? boards.find((item) => item.key === params.boardKey)
			: boards.find((item) => item.starred) ?? boards[0];
		if (!board) return null;

		return {
			board,
			statuses: statuses.filter((status) => status.boardId === board.id).sort((a, b) => a.rank - b.rank),
			priorities,
			users,
			tasks: tasks.filter((task) => task.boardId === board.id),
		};
	}, [params.boardKey, boards, statuses, priorities, users, tasks]);
}
