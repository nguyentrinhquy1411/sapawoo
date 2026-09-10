import dayjs from "dayjs";
import { Check, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { PriorityIcon } from "@/components/task/priority-badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { initialsOf } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import type { Board, BoardStatus } from "@/types";

interface CreateTaskDialogProps {
	board: Board;
	statuses: BoardStatus[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultStatusId?: string;
}

export function CreateTaskDialog({
	board,
	statuses,
	open,
	onOpenChange,
	defaultStatusId,
}: CreateTaskDialogProps) {
	const priorities = useAppStore((state) => state.priorities);
	const users = useAppStore((state) => state.users);
	const createTask = useAppStore((state) => state.createTask);
	const updateTask = useAppStore((state) => state.updateTask);

	const fallbackStatusId = defaultStatusId ?? statuses[0]?.id ?? "";
	const noPriorityId = priorities.find((priority) => priority.key === "none")?.id ?? priorities[0]?.id ?? "";

	const [summary, setSummary] = useState("");
	const [description, setDescription] = useState("");
	const [statusId, setStatusId] = useState(fallbackStatusId);
	const [priorityId, setPriorityId] = useState(noPriorityId);
	const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
	const [dueDate, setDueDate] = useState("");

	useEffect(() => {
		if (!open) return;
		setSummary("");
		setDescription("");
		setStatusId(fallbackStatusId);
		setPriorityId(noPriorityId);
		setAssigneeIds([]);
		setDueDate("");
	}, [open, fallbackStatusId, noPriorityId]);

	const submit = () => {
		const trimmed = summary.trim();
		if (!trimmed || !statusId) return;

		const created = createTask({ boardId: board.id, statusId, summary: trimmed });
		if (created) {
			updateTask(created.id, {
				description,
				priorityId,
				assigneeIds,
				endDate: dueDate ? dayjs(dueDate).toISOString() : null,
			});
		}
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>New task</DialogTitle>
					<DialogDescription>
						It will be added to {board.name} ({board.key}).
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 p-5">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="task-summary">Summary</Label>
						<Input
							id="task-summary"
							autoFocus
							value={summary}
							placeholder="What needs to be done?"
							onChange={(event) => setSummary(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") submit();
							}}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="task-description">Description</Label>
						<Textarea
							id="task-description"
							value={description}
							placeholder="Add context, acceptance criteria and links…"
							onChange={(event) => setDescription(event.target.value)}
						/>
					</div>

					<div className="grid gap-4 sm:grid-cols-3">
						<div className="flex flex-col gap-1.5">
							<Label>Status</Label>
							<Select value={statusId} onValueChange={setStatusId}>
								<SelectTrigger>
									<SelectValue />
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
						</div>

						<div className="flex flex-col gap-1.5">
							<Label>Priority</Label>
							<Select value={priorityId} onValueChange={setPriorityId}>
								<SelectTrigger>
									<SelectValue />
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
						</div>

						<div className="flex flex-col gap-1.5">
							<Label htmlFor="task-due">Due date</Label>
							<Input
								id="task-due"
								type="date"
								value={dueDate}
								onChange={(event) => setDueDate(event.target.value)}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>Assignees</Label>
						<div className="flex flex-wrap gap-1">
							{users.map((user) => {
								const selected = assigneeIds.includes(user.id);
								return (
									<Button
										key={user.id}
										type="button"
										variant="outline"
										size="sm"
										className={selected ? "gap-1.5 border-primary text-primary" : "gap-1.5"}
										onClick={() =>
											setAssigneeIds((current) =>
												current.includes(user.id)
													? current.filter((id) => id !== user.id)
													: [...current, user.id],
											)
										}
									>
										<span
											className="flex size-4 items-center justify-center rounded-full text-[9px] font-semibold text-card"
											style={{ backgroundColor: user.avatarColor }}
										>
											{initialsOf(user)}
										</span>
										<span>{user.displayName}</span>
										{selected && <Check className="size-3" />}
									</Button>
								);
							})}
						</div>
					</div>

					<div className="flex justify-end gap-2 border-t border-border pt-4">
						<Button variant="ghost" onClick={() => onOpenChange(false)}>
							<span>Cancel</span>
						</Button>
						<Button className="gap-1.5" disabled={!summary.trim()} onClick={submit}>
							<Plus />
							<span>Create task</span>
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
