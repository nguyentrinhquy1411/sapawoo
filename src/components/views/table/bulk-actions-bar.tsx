import { Trash2, X } from "lucide-react";
import { PriorityIcon } from "@/components/task/priority-badge";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";
import type { BoardStatus } from "@/types";

export function BulkActionsBar({ statuses }: { statuses: BoardStatus[] }) {
	const selectedTaskIds = useUiStore((state) => state.selectedTaskIds);
	const clearSelection = useUiStore((state) => state.clearSelection);
	const priorities = useAppStore((state) => state.priorities);
	const updateTasks = useAppStore((state) => state.updateTasks);
	const deleteTasks = useAppStore((state) => state.deleteTasks);

	if (selectedTaskIds.length === 0) return null;

	return (
		<div className="pointer-events-auto fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-popover p-2 shadow-xl">
			<span className="px-2 text-sm font-medium">
				{selectedTaskIds.length} selected
			</span>

			<Separator orientation="vertical" className="h-6" />

			<Select onValueChange={(statusId) => updateTasks(selectedTaskIds, { statusId })}>
				<SelectTrigger className="h-8 w-36">
					<SelectValue placeholder="Set status" />
				</SelectTrigger>
				<SelectContent>
					{statuses.map((status) => (
						<SelectItem key={status.id} value={status.id}>
							<span className="flex items-center gap-2">
								<span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
								<span>{status.name}</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select onValueChange={(priorityId) => updateTasks(selectedTaskIds, { priorityId })}>
				<SelectTrigger className="h-8 w-36">
					<SelectValue placeholder="Set priority" />
				</SelectTrigger>
				<SelectContent>
					{priorities.map((priority) => (
						<SelectItem key={priority.id} value={priority.id}>
							<span className="flex items-center gap-2">
								<PriorityIcon priority={priority} />
								<span>{priority.name}</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Button
				variant="ghost"
				size="sm"
				className="gap-1.5 text-destructive hover:bg-destructive/10"
				onClick={() => {
					deleteTasks(selectedTaskIds);
					clearSelection();
				}}
			>
				<Trash2 />
				<span>Delete</span>
			</Button>

			<Separator orientation="vertical" className="h-6" />

			<Button variant="ghost" size="icon-sm" onClick={clearSelection}>
				<X />
			</Button>
		</div>
	);
}
