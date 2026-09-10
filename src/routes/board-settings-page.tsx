import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { useBoardByKey, useBoardStatuses, useBoardTasks } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import type { StatusCategory } from "@/types";

const BOARD_COLORS = [
	"var(--color-primary)",
	"var(--color-chart-1)",
	"var(--color-chart-2)",
	"var(--color-chart-3)",
	"var(--color-chart-4)",
	"var(--color-chart-5)",
];

const STATUS_CATEGORIES: StatusCategory[] = ["to_do", "in_progress", "done"];

const CATEGORY_LABELS: Record<StatusCategory, string> = {
	to_do: "To do",
	in_progress: "In progress",
	done: "Done",
};

export function BoardSettingsPage() {
	const { boardKey } = useParams({ from: "/boards/$boardKey/settings" });
	const navigate = useNavigate();
	const board = useBoardByKey(boardKey);
	const statuses = useBoardStatuses(board?.id);
	const tasks = useBoardTasks(board?.id);

	const updateBoard = useAppStore((state) => state.updateBoard);
	const deleteBoard = useAppStore((state) => state.deleteBoard);
	const createStatus = useAppStore((state) => state.createStatus);
	const updateStatus = useAppStore((state) => state.updateStatus);
	const moveStatus = useAppStore((state) => state.moveStatus);
	const deleteStatus = useAppStore((state) => state.deleteStatus);

	const [newStatusName, setNewStatusName] = useState("");
	const [confirmDelete, setConfirmDelete] = useState("");

	if (!board) {
		return (
			<>
				<TopBar title="Board not found" />
				<div className="p-6 text-sm text-muted-foreground">
					<span>No board with key {boardKey}.</span>
				</div>
			</>
		);
	}

	const taskCountByStatus = (statusId: string) =>
		tasks.filter((task) => task.statusId === statusId).length;

	return (
		<>
			<TopBar
				title={`${board.name} settings`}
				breadcrumbs={[
					{ label: "Boards", to: "/boards" },
					{ label: board.name },
				]}
				actions={
					<Button asChild variant="outline" size="sm">
						<Link to="/boards/$boardKey" params={{ boardKey }} search={{ view: "kanban" }}>
							<span>Back to board</span>
						</Link>
					</Button>
				}
			/>

			<div className="flex-1 overflow-y-auto p-6">
				<div className="mx-auto flex max-w-3xl flex-col gap-4">
					<Card>
						<CardHeader>
							<CardTitle>General</CardTitle>
							<CardDescription>Name, key and description of this board.</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="grid gap-4 sm:grid-cols-[120px_1fr]">
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="board-key">Key</Label>
									<Input
										id="board-key"
										value={board.key}
										maxLength={5}
										onChange={(event) =>
											updateBoard(board.id, { key: event.target.value.toUpperCase() })
										}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="board-name">Name</Label>
									<Input
										id="board-name"
										value={board.name}
										onChange={(event) => updateBoard(board.id, { name: event.target.value })}
									/>
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label htmlFor="board-description">Description</Label>
								<Textarea
									id="board-description"
									value={board.description}
									onChange={(event) => updateBoard(board.id, { description: event.target.value })}
								/>
							</div>

							<div className="flex flex-col gap-1.5">
								<Label>Color</Label>
								<div className="flex gap-2">
									{BOARD_COLORS.map((color) => (
										<Button
											key={color}
											variant="ghost"
											size="icon-sm"
											className={cn(
												"size-7 rounded-full border-2 border-transparent p-0",
												board.color === color && "border-foreground",
											)}
											onClick={() => updateBoard(board.id, { color })}
										>
											<span className="size-5 rounded-full" style={{ backgroundColor: color }} />
										</Button>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Statuses</CardTitle>
							<CardDescription>
								Kanban columns come from these statuses, in this order.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							{statuses.map((status, index) => (
								<div key={status.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
									<span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
									<Input
										value={status.name}
										className="h-8 flex-1"
										onChange={(event) => updateStatus(status.id, { name: event.target.value })}
									/>
									<Select
										value={status.statusCategory}
										onValueChange={(value) =>
											updateStatus(status.id, { statusCategory: value as StatusCategory })
										}
									>
										<SelectTrigger className="h-8 w-36">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{STATUS_CATEGORIES.map((category) => (
												<SelectItem key={category} value={category}>
													{CATEGORY_LABELS[category]}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Badge variant="muted">{taskCountByStatus(status.id)}</Badge>
									<Button
										variant="ghost"
										size="icon-sm"
										disabled={index === 0}
										onClick={() => moveStatus(status.id, -1)}
									>
										<ArrowUp />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										disabled={index === statuses.length - 1}
										onClick={() => moveStatus(status.id, 1)}
									>
										<ArrowDown />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										className="text-destructive hover:bg-destructive/10"
										disabled={statuses.length <= 1}
										onClick={() => {
											const fallback = statuses.find((item) => item.id !== status.id);
											if (fallback) deleteStatus(status.id, fallback.id);
										}}
									>
										<Trash2 />
									</Button>
								</div>
							))}

							<Separator className="my-1" />

							<div className="flex gap-2">
								<Input
									value={newStatusName}
									placeholder="New status name"
									className="h-8"
									onChange={(event) => setNewStatusName(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter" && newStatusName.trim()) {
											createStatus(board.id, { name: newStatusName.trim(), statusCategory: "to_do" });
											setNewStatusName("");
										}
									}}
								/>
								<Button
									size="sm"
									className="gap-1.5"
									disabled={!newStatusName.trim()}
									onClick={() => {
										createStatus(board.id, { name: newStatusName.trim(), statusCategory: "to_do" });
										setNewStatusName("");
									}}
								>
									<Plus />
									<span>Add status</span>
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="border-destructive/40">
						<CardHeader>
							<CardTitle className="text-destructive">Danger zone</CardTitle>
							<CardDescription>
								Deleting this board removes its {tasks.length} tasks and their comments.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							<Label htmlFor="confirm-delete">Type {board.key} to confirm</Label>
							<div className="flex gap-2">
								<Input
									id="confirm-delete"
									value={confirmDelete}
									className="h-8"
									onChange={(event) => setConfirmDelete(event.target.value.toUpperCase())}
								/>
								<Button
									variant="destructive"
									size="sm"
									className="gap-1.5"
									disabled={confirmDelete !== board.key}
									onClick={() => {
										deleteBoard(board.id);
										navigate({ to: "/boards" });
									}}
								>
									<Trash2 />
									<span>Delete board</span>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
