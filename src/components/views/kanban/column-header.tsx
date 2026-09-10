import { ChevronsDownUp, Gauge, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TaskGroup } from "@/types";

interface ColumnHeaderProps {
	group: TaskGroup;
	count: number;
	limit?: number;
	onAddTask: () => void;
	onCollapse: () => void;
	onSetLimit: (limit: number | undefined) => void;
	onClearDone?: () => void;
}

export function ColumnHeader({
	group,
	count,
	limit,
	onAddTask,
	onCollapse,
	onSetLimit,
	onClearDone,
}: ColumnHeaderProps) {
	const [limitOpen, setLimitOpen] = useState(false);
	const [draftLimit, setDraftLimit] = useState(String(limit ?? ""));
	const overLimit = limit !== undefined && count > limit;

	return (
		<div className="flex items-center justify-between gap-2 px-1">
			<div className="flex min-w-0 items-center gap-2">
				<span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: group.color }} />
				<span className="truncate text-sm font-semibold">{group.name}</span>
				<Badge variant={overLimit ? "destructive" : "muted"}>
					{limit === undefined ? count : `${count}/${limit}`}
				</Badge>
			</div>

			<div className="flex shrink-0 items-center">
				<Button variant="ghost" size="icon-sm" onClick={onAddTask}>
					<Plus />
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon-sm">
							<MoreHorizontal />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onSelect={onAddTask}>
							<Plus />
							<span>Add task</span>
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={onCollapse}>
							<ChevronsDownUp />
							<span>Collapse column</span>
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={() => setLimitOpen(true)}>
							<Gauge />
							<span>Set column limit</span>
						</DropdownMenuItem>
						{onClearDone && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
									onSelect={onClearDone}
								>
									<Trash2 />
									<span>Delete all in column</span>
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			<Dialog open={limitOpen} onOpenChange={setLimitOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Column limit</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3 p-5">
						<Label htmlFor="column-limit">Max tasks in "{group.name}"</Label>
						<Input
							id="column-limit"
							type="number"
							min={0}
							value={draftLimit}
							placeholder="No limit"
							onChange={(event) => setDraftLimit(event.target.value)}
						/>
						<p className={cn("text-xs text-muted-foreground")}>
							<span>The header turns red when the column goes over its limit.</span>
						</p>
						<div className="flex gap-2">
							<Button
								className="flex-1"
								onClick={() => {
									const parsed = Number.parseInt(draftLimit, 10);
									onSetLimit(Number.isFinite(parsed) && parsed > 0 ? parsed : undefined);
									setLimitOpen(false);
								}}
							>
								<span>Save</span>
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setDraftLimit("");
									onSetLimit(undefined);
									setLimitOpen(false);
								}}
							>
								<span>Clear</span>
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
