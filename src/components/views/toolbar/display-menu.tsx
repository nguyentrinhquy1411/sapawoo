import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ALL_TASK_FIELDS, TASK_FIELD_LABELS } from "@/lib/view-settings";
import { cn } from "@/lib/utils";
import type { ViewSettingsController } from "@/store/use-view-settings";
import type { BoardApp, Density, TaskField } from "@/types";

const DENSITIES: Density[] = ["comfortable", "compact"];

export function DisplayMenu({ controller, app }: { controller: ViewSettingsController; app: BoardApp }) {
	const { settings, patchSettings } = controller;
	const fields = ALL_TASK_FIELDS.filter((field) => (app === "kanban" ? field !== "status" : field !== "description"));

	const toggleField = (field: TaskField) =>
		patchSettings({
			visibleFields: settings.visibleFields.includes(field)
				? settings.visibleFields.filter((item) => item !== field)
				: [...settings.visibleFields, field],
		});

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-1.5">
					<Settings2 />
					<span>Display</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64">
				<span className="px-2 text-sm font-semibold">Display</span>
				<Separator className="my-2" />

				<div className="flex flex-col gap-2 px-2">
					<Label>{app === "kanban" ? "Card fields" : "Columns"}</Label>
					{fields.map((field) => (
						<div key={field} className="flex items-center justify-between gap-2">
							<span className="text-sm">{TASK_FIELD_LABELS[field]}</span>
							<Switch
								checked={settings.visibleFields.includes(field)}
								onCheckedChange={() => toggleField(field)}
							/>
						</div>
					))}
				</div>

				<Separator className="my-2" />

				<div className="flex flex-col gap-2 px-2 pb-1">
					<Label>Density</Label>
					<div className="flex gap-1">
						{DENSITIES.map((density) => (
							<Button
								key={density}
								variant="outline"
								size="sm"
								className={cn(
									"flex-1 capitalize",
									settings.density === density && "border-primary text-primary",
								)}
								onClick={() => patchSettings({ density })}
							>
								<span>{density}</span>
							</Button>
						))}
					</div>

					<div className="mt-1 flex items-center justify-between gap-2">
						<span className="text-sm">Show empty groups</span>
						<Switch
							checked={settings.showEmptyGroups}
							onCheckedChange={(checked) => patchSettings({ showEmptyGroups: checked })}
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
