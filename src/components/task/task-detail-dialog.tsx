import dayjs from "dayjs";
import { Check, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AssigneeAvatar } from "@/components/task/assignee-avatar";
import { PriorityIcon } from "@/components/task/priority-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { initialsOf, taskKey, useBoardStatuses } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";
import type { Task } from "@/types";

export function TaskDetailDialog() {
	const openTaskId = useUiStore((state) => state.openTaskId);
	const openTask = useUiStore((state) => state.openTask);
	const task = useAppStore((state) => state.tasks.find((item) => item.id === openTaskId));

	if (!task) return null;

	return (
		<Dialog open onOpenChange={(open) => !open && openTask(null)}>
			<TaskDetailContent key={task.id} task={task} onClose={() => openTask(null)} />
		</Dialog>
	);
}

function TaskDetailContent({ task, onClose }: { task: Task; onClose: () => void }) {
	const statuses = useBoardStatuses(task.boardId);
	const priorities = useAppStore((state) => state.priorities);
	const users = useAppStore((state) => state.users);
	const allComments = useAppStore((state) => state.comments);
	const comments = useMemo(
		() =>
			allComments
				.filter((comment) => comment.taskId === task.id)
				.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
		[allComments, task.id],
	);
	const updateTask = useAppStore((state) => state.updateTask);
	const setAssignees = useAppStore((state) => state.setAssignees);
	const deleteTask = useAppStore((state) => state.deleteTask);
	const addComment = useAppStore((state) => state.addComment);

	const [summary, setSummary] = useState(task.summary);
	const [description, setDescription] = useState(task.description);
	const [draftComment, setDraftComment] = useState("");

	const currentUser = users[0];

	const submitComment = () => {
		if (!draftComment.trim()) return;
		addComment(task.id, currentUser.id, draftComment.trim());
		setDraftComment("");
	};

	const toggleAssignee = (userId: string) => {
		const next = task.assigneeIds.includes(userId)
			? task.assigneeIds.filter((id) => id !== userId)
			: [...task.assigneeIds, userId];
		setAssignees(task.id, next);
	};

	return (
		<DialogContent className="max-h-[88vh] overflow-hidden">
			<DialogHeader>
				<Badge variant="outline" className="w-fit font-mono">
					{taskKey(task)}
				</Badge>
				<DialogTitle className="sr-only">{task.summary}</DialogTitle>
				<Input
					value={summary}
					onChange={(event) => setSummary(event.target.value)}
					onBlur={() => updateTask(task.id, { summary: summary.trim() || task.summary })}
					onKeyDown={(event) => {
						if (event.key === "Enter") event.currentTarget.blur();
					}}
					className="h-auto rounded-md border-0 bg-transparent px-1 text-lg font-semibold shadow-none transition-colors hover:bg-accent focus-visible:bg-card focus-visible:ring-2"
				/>
			</DialogHeader>

			<div className="grid max-h-[70vh] grid-cols-1 gap-6 overflow-y-auto p-5 md:grid-cols-[1fr_240px]">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<Label>Description</Label>
						<Textarea
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							onBlur={() => updateTask(task.id, { description })}
							placeholder="Add a description…"
							className="min-h-28"
						/>
					</div>

					<div className="flex flex-col gap-3">
						<Label>Comments</Label>
						{comments.length === 0 && (
							<p className="text-sm text-muted-foreground">
								<span>No comments yet.</span>
							</p>
						)}
						{comments.map((comment) => {
							const author = users.find((user) => user.id === comment.authorId);
							return (
								<div key={comment.id} className="flex gap-3">
									{author && <AssigneeAvatar user={author} />}
									<div className="flex flex-1 flex-col gap-1 rounded-lg bg-muted p-3">
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<span className="font-medium text-foreground">
												{author?.displayName ?? "Unknown"}
											</span>
											<span>{dayjs(comment.createdAt).format("MMM D, HH:mm")}</span>
										</div>
										<p className="text-sm">{comment.content}</p>
									</div>
								</div>
							);
						})}
						<div className="flex gap-2">
							<Input
								value={draftComment}
								onChange={(event) => setDraftComment(event.target.value)}
								onKeyDown={(event) => event.key === "Enter" && submitComment()}
								placeholder="Write a comment…"
							/>
							<Button onClick={submitComment} disabled={!draftComment.trim()}>
								<span>Send</span>
							</Button>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label>Status</Label>
						<Select
							value={task.statusId}
							onValueChange={(statusId) => updateTask(task.id, { statusId })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{statuses.map((status) => (
									<SelectItem key={status.id} value={status.id}>
										<span className="flex items-center gap-2">
											<span
												className="size-2 rounded-full"
												style={{ backgroundColor: status.color }}
											/>
											<span>{status.name}</span>
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>Priority</Label>
						<Select
							value={task.priorityId}
							onValueChange={(priorityId) => updateTask(task.id, { priorityId })}
						>
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
						<Label>Due date</Label>
						<Input
							type="date"
							value={task.endDate ? dayjs(task.endDate).format("YYYY-MM-DD") : ""}
							onChange={(event) =>
								updateTask(task.id, {
									endDate: event.target.value ? dayjs(event.target.value).toISOString() : null,
								})
							}
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>Assignees</Label>
						<div className="flex flex-col gap-1">
							{users.map((user) => {
								const selected = task.assigneeIds.includes(user.id);
								return (
									<Button
										key={user.id}
										variant="ghost"
										size="sm"
										className="justify-start gap-2 px-2"
										onClick={() => toggleAssignee(user.id)}
									>
										<span
											className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-card"
											style={{ backgroundColor: user.avatarColor }}
										>
											{initialsOf(user)}
										</span>
										<span className="flex-1 truncate text-left">{user.displayName}</span>
										{selected && <Check className="size-3.5 text-primary" />}
									</Button>
								);
							})}
						</div>
					</div>

					<Separator />

					<Button
						variant="ghost"
						size="sm"
						className="justify-start gap-2 px-2 text-destructive hover:bg-destructive/10"
						onClick={() => {
							deleteTask(task.id);
							onClose();
						}}
					>
						<Trash2 />
						<span>Delete task</span>
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}
