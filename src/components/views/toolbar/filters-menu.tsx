import { CalendarClock, Flag, ListFilter, SignalHigh, Users } from "lucide-react";
import type { ReactNode } from "react";
import { PriorityIcon } from "@/components/task/priority-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { DUE_DATE_LABELS, countActiveFilters } from "@/lib/view-settings";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import type { ViewSettingsController } from "@/store/use-view-settings";
import { type BoardStatus, type DueDatePreset, UNASSIGNED } from "@/types";

const DUE_DATE_OPTIONS: DueDatePreset[] = ["any", "overdue", "today", "this_week", "this_month", "no_date"];

function FilterSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
	return (
		<div className="flex flex-col gap-1 py-1">
			<span className="flex items-center gap-1.5 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{icon}
				<span>{title}</span>
			</span>
			{children}
		</div>
	);
}

function CheckRow({
	checked,
	onToggle,
	children,
}: {
	checked: boolean;
	onToggle: () => void;
	children: ReactNode;
}) {
	return (
		<Button variant="ghost" size="sm" className="h-8 justify-start gap-2 px-2 font-normal" onClick={onToggle}>
			<Checkbox checked={checked} className="pointer-events-none" />
			{children}
		</Button>
	);
}

export function FiltersMenu({
	controller,
	statuses,
}: {
	controller: ViewSettingsController;
	statuses: BoardStatus[];
}) {
	const users = useAppStore((state) => state.users);
	const priorities = useAppStore((state) => state.priorities);
	const { settings, toggleInFilter, patchFilters, resetFilters } = controller;
	const activeCount = countActiveFilters(settings);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className={cn("gap-1.5", activeCount > 0 && "text-primary")}>
					<ListFilter />
					<span>Filters</span>
					{activeCount > 0 && <Badge variant="default">{activeCount}</Badge>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="max-h-[70vh] w-72 overflow-y-auto">
				<div className="flex items-center justify-between px-2 py-1">
					<span className="text-sm font-semibold">Filters</span>
					{activeCount > 0 && (
						<Button variant="ghost" size="sm" className="h-7 text-muted-foreground" onClick={resetFilters}>
							<span>Reset</span>
						</Button>
					)}
				</div>
				<Separator />

				<FilterSection icon={<SignalHigh className="size-3.5" />} title="Status">
					{statuses.map((status) => (
						<CheckRow
							key={status.id}
							checked={settings.filters.statusIds.includes(status.id)}
							onToggle={() => toggleInFilter("statusIds", status.id)}
						>
							<span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
							<span className="truncate">{status.name}</span>
						</CheckRow>
					))}
				</FilterSection>

				<Separator />

				<FilterSection icon={<Users className="size-3.5" />} title="Assignee">
					{users.map((user) => (
						<CheckRow
							key={user.id}
							checked={settings.filters.assigneeIds.includes(user.id)}
							onToggle={() => toggleInFilter("assigneeIds", user.id)}
						>
							<span
								className="size-2 rounded-full"
								style={{ backgroundColor: user.avatarColor }}
							/>
							<span className="truncate">{user.displayName}</span>
						</CheckRow>
					))}
					<CheckRow
						checked={settings.filters.assigneeIds.includes(UNASSIGNED)}
						onToggle={() => toggleInFilter("assigneeIds", UNASSIGNED)}
					>
						<span className="size-2 rounded-full bg-muted-foreground" />
						<span>Unassigned</span>
					</CheckRow>
				</FilterSection>

				<Separator />

				<FilterSection icon={<Flag className="size-3.5" />} title="Priority">
					{priorities.map((priority) => (
						<CheckRow
							key={priority.id}
							checked={settings.filters.priorityIds.includes(priority.id)}
							onToggle={() => toggleInFilter("priorityIds", priority.id)}
						>
							<PriorityIcon priority={priority} />
							<span>{priority.name}</span>
						</CheckRow>
					))}
				</FilterSection>

				<Separator />

				<FilterSection icon={<CalendarClock className="size-3.5" />} title="Due date">
					{DUE_DATE_OPTIONS.map((preset) => (
						<Button
							key={preset}
							variant="ghost"
							size="sm"
							className={cn(
								"h-8 justify-start px-2 font-normal",
								settings.filters.dueDate === preset && "bg-accent text-accent-foreground",
							)}
							onClick={() => patchFilters({ dueDate: preset })}
						>
							<span>{DUE_DATE_LABELS[preset]}</span>
						</Button>
					))}
				</FilterSection>
			</PopoverContent>
		</Popover>
	);
}
