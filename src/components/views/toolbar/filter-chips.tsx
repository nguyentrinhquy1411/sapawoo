import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DUE_DATE_LABELS, countActiveFilters } from "@/lib/view-settings";
import { useAppStore } from "@/store/use-app-store";
import type { ViewSettingsController } from "@/store/use-view-settings";
import { type BoardStatus, UNASSIGNED } from "@/types";

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
	return (
		<Badge variant="outline" className="gap-1 bg-card py-1 pr-1">
			<span>{label}</span>
			<Button variant="ghost" size="icon-sm" className="size-4 text-muted-foreground" onClick={onRemove}>
				<X className="size-3" />
			</Button>
		</Badge>
	);
}

export function FilterChips({
	controller,
	statuses,
	shown,
	total,
}: {
	controller: ViewSettingsController;
	statuses: BoardStatus[];
	shown: number;
	total: number;
}) {
	const users = useAppStore((state) => state.users);
	const priorities = useAppStore((state) => state.priorities);
	const { settings, toggleInFilter, patchFilters, resetFilters } = controller;
	const { filters } = settings;

	const hasChips = countActiveFilters(settings) > 0 || filters.search.length > 0;
	if (!hasChips) return null;

	return (
		<div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-6 py-2">
			{filters.search && (
				<Chip label={`Search: ${filters.search}`} onRemove={() => patchFilters({ search: "" })} />
			)}

			{filters.statusIds.map((statusId) => (
				<Chip
					key={statusId}
					label={statuses.find((status) => status.id === statusId)?.name ?? "Status"}
					onRemove={() => toggleInFilter("statusIds", statusId)}
				/>
			))}

			{filters.assigneeIds.map((assigneeId) => (
				<Chip
					key={assigneeId}
					label={
						assigneeId === UNASSIGNED
							? "Unassigned"
							: (users.find((user) => user.id === assigneeId)?.displayName ?? "Assignee")
					}
					onRemove={() => toggleInFilter("assigneeIds", assigneeId)}
				/>
			))}

			{filters.priorityIds.map((priorityId) => (
				<Chip
					key={priorityId}
					label={priorities.find((priority) => priority.id === priorityId)?.name ?? "Priority"}
					onRemove={() => toggleInFilter("priorityIds", priorityId)}
				/>
			))}

			{filters.dueDate !== "any" && (
				<Chip label={DUE_DATE_LABELS[filters.dueDate]} onRemove={() => patchFilters({ dueDate: "any" })} />
			)}

			<span className="text-xs text-muted-foreground">
				{shown} of {total} tasks
			</span>

			<Button
				variant="ghost"
				size="sm"
				className="ml-auto h-7 gap-1 text-muted-foreground"
				onClick={resetFilters}
			>
				<X />
				<span>Clear all</span>
			</Button>
		</div>
	);
}
