import { ChevronsDownUp, ChevronsUpDown, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { AvatarFilter } from "@/components/views/toolbar/avatar-filter";
import { DisplayMenu } from "@/components/views/toolbar/display-menu";
import { FiltersMenu } from "@/components/views/toolbar/filters-menu";
import { GroupByMenu } from "@/components/views/toolbar/group-by-menu";
import { SearchInput } from "@/components/views/toolbar/search-input";
import { SortsMenu } from "@/components/views/toolbar/sorts-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ViewSettingsController } from "@/store/use-view-settings";
import type { BoardApp, BoardStatus, TaskGroup } from "@/types";

interface ViewToolbarProps {
	app: BoardApp;
	controller: ViewSettingsController;
	statuses: BoardStatus[];
	groups: TaskGroup[];
	onCreateTask: () => void;
	extra?: ReactNode;
}

export function ViewToolbar({
	app,
	controller,
	statuses,
	groups,
	onCreateTask,
	extra,
}: ViewToolbarProps) {
	const { settings, patchSettings, patchFilters } = controller;
	const allCollapsed = groups.length > 0 && settings.collapsedGroupIds.length >= groups.length;

	return (
		<div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-card px-6 py-2">
			<Button size="sm" className="gap-1.5" onClick={onCreateTask}>
				<Plus />
				<span>New task</span>
			</Button>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<AvatarFilter controller={controller} />

			<div className="ml-auto flex flex-wrap items-center gap-1">
				<SearchInput
					value={settings.filters.search}
					onChange={(search) => patchFilters({ search })}
				/>
				<FiltersMenu controller={controller} statuses={statuses} />
				<SortsMenu controller={controller} />
				<GroupByMenu controller={controller} app={app} />
				<DisplayMenu controller={controller} app={app} />
				{extra}
				<Button
					variant="ghost"
					size="sm"
					className="gap-1.5"
					onClick={() =>
						patchSettings({ collapsedGroupIds: allCollapsed ? [] : groups.map((group) => group.id) })
					}
				>
					{allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
					<span>{allCollapsed ? "Expand all" : "Collapse all"}</span>
				</Button>
			</div>
		</div>
	);
}
