import { Link } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

function CreateBoardDialog() {
	const createBoard = useAppStore((state) => state.createBoard);
	const [open, setOpen] = useState(false);
	const [key, setKey] = useState("");
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const submit = () => {
		if (!key.trim() || !name.trim()) return;
		createBoard({ key: key.trim(), name: name.trim(), description: description.trim() });
		setKey("");
		setName("");
		setDescription("");
		setOpen(false);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" className="gap-1.5">
					<Plus />
					<span>New board</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Create board</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4 p-5">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="board-key">Key</Label>
						<Input
							id="board-key"
							value={key}
							maxLength={5}
							placeholder="OPS"
							onChange={(event) => setKey(event.target.value.toUpperCase())}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="board-name">Name</Label>
						<Input
							id="board-name"
							value={name}
							placeholder="Operations"
							onChange={(event) => setName(event.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="board-description">Description</Label>
						<Textarea
							id="board-description"
							value={description}
							placeholder="What is this board for?"
							onChange={(event) => setDescription(event.target.value)}
						/>
					</div>
					<Button onClick={submit} disabled={!key.trim() || !name.trim()}>
						<span>Create board</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function BoardsPage() {
	const boards = useAppStore((state) => state.boards);
	const tasks = useAppStore((state) => state.tasks);
	const statuses = useAppStore((state) => state.statuses);
	const toggleStar = useAppStore((state) => state.toggleStar);

	return (
		<>
			<TopBar title="Boards" subtitle={`${boards.length} boards in this site`} actions={<CreateBoardDialog />} />

			<div className="flex-1 overflow-y-auto p-6">
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{boards.map((board) => {
						const boardTasks = tasks.filter((task) => task.boardId === board.id);
						const doneIds = new Set(
							statuses
								.filter((status) => status.boardId === board.id && status.statusCategory === "done")
								.map((status) => status.id),
						);
						const done = boardTasks.filter((task) => doneIds.has(task.statusId)).length;
						const progress = boardTasks.length ? Math.round((done / boardTasks.length) * 100) : 0;

						return (
							<Card key={board.id} className="transition-shadow hover:shadow-md">
								<CardHeader className="flex-row items-start justify-between gap-2">
									<div className="flex min-w-0 flex-col gap-1">
										<div className="flex items-center gap-2">
											<span
												className="flex size-7 items-center justify-center rounded-md text-[10px] font-bold text-card"
												style={{ backgroundColor: board.color }}
											>
												{board.key}
											</span>
											<CardTitle className="truncate">{board.name}</CardTitle>
										</div>
										<CardDescription className="line-clamp-2">{board.description}</CardDescription>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => toggleStar(board.id)}
										className={cn("shrink-0", board.starred ? "text-primary" : "text-muted-foreground")}
									>
										<Star className={cn(board.starred && "fill-current")} />
									</Button>
								</CardHeader>
								<CardContent className="flex flex-col gap-3">
									<div className="flex items-center gap-2">
										<Badge variant="muted">{boardTasks.length} tasks</Badge>
										<Badge variant="muted">{progress}% done</Badge>
									</div>
									<div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
										<div
											className="h-full rounded-full bg-primary transition-all"
											style={{ width: `${progress}%` }}
										/>
									</div>
									<Button asChild variant="outline" size="sm" className="w-fit">
										<Link to="/boards/$boardKey" params={{ boardKey: board.key }}>
											<span>Open board</span>
										</Link>
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</>
	);
}
