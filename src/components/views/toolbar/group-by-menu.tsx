import { Group } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GROUP_FIELD_LABELS } from "@/lib/view-settings";
import { cn } from "@/lib/utils";
import type { ViewSettingsController } from "@/store/use-view-settings";
import type { BoardApp, GroupField } from "@/types";

export function GroupByMenu({ controller, app }: { controller: ViewSettingsController; app: BoardApp }) {
	const { settings, patchSettings } = controller;
	const fields: GroupField[] = app === "kanban" ? ["status", "assignee", "priority"] : ["status", "assignee", "priority", "none"];

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-1.5">
					<Group />
					<span>Group: {GROUP_FIELD_LABELS[settings.groupBy]}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-48">
				<span className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Group by
				</span>
				<div className="mt-1 flex flex-col">
					{fields.map((field) => (
						<Button
							key={field}
							variant="ghost"
							size="sm"
							className={cn(
								"justify-start font-normal",
								settings.groupBy === field && "bg-accent text-accent-foreground",
							)}
							onClick={() => patchSettings({ groupBy: field, collapsedGroupIds: [] })}
						>
							<span>{GROUP_FIELD_LABELS[field]}</span>
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
