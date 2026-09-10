import { ArrowDownUp, ArrowDownWideNarrow, ArrowUpNarrowWide, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SORT_FIELD_LABELS } from "@/lib/view-settings";
import { cn } from "@/lib/utils";
import type { ViewSettingsController } from "@/store/use-view-settings";
import type { SortField } from "@/types";

const SORT_FIELDS: SortField[] = ["key", "summary", "status", "priority", "endDate", "createdAt", "updatedAt"];

export function SortsMenu({ controller }: { controller: ViewSettingsController }) {
	const { settings, patchSettings } = controller;
	const sorts = settings.sorts;

	const addSort = () => {
		const used = new Set(sorts.map((rule) => rule.field));
		const next = SORT_FIELDS.find((field) => !used.has(field));
		if (next) patchSettings({ sorts: [...sorts, { field: next, direction: "asc" }] });
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className={cn("gap-1.5", sorts.length > 0 && "text-primary")}>
					<ArrowDownUp />
					<span>Sort</span>
					{sorts.length > 0 && <Badge variant="default">{sorts.length}</Badge>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80">
				<div className="flex items-center justify-between px-2 py-1">
					<span className="text-sm font-semibold">Sort by</span>
					{sorts.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-muted-foreground"
							onClick={() => patchSettings({ sorts: [] })}
						>
							<span>Reset</span>
						</Button>
					)}
				</div>
				<Separator />

				<div className="flex flex-col gap-2 p-2">
					{sorts.length === 0 && (
						<p className="px-1 text-xs text-muted-foreground">
							<span>No sort applied — cards keep their manual order.</span>
						</p>
					)}

					{sorts.map((rule, index) => (
						<div key={rule.field} className="flex items-center gap-1">
							<Select
								value={rule.field}
								onValueChange={(field) =>
									patchSettings({
										sorts: sorts.map((item, position) =>
											position === index ? { ...item, field: field as SortField } : item,
										),
									})
								}
							>
								<SelectTrigger className="h-8 flex-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SORT_FIELDS.filter(
										(field) => field === rule.field || !sorts.some((item) => item.field === field),
									).map((field) => (
										<SelectItem key={field} value={field}>
											{SORT_FIELD_LABELS[field]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Button
								variant="outline"
								size="icon-sm"
								className="size-8"
								onClick={() =>
									patchSettings({
										sorts: sorts.map((item, position) =>
											position === index
												? { ...item, direction: item.direction === "asc" ? "desc" : "asc" }
												: item,
										),
									})
								}
							>
								{rule.direction === "asc" ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />}
							</Button>

							<Button
								variant="ghost"
								size="icon-sm"
								className="size-8 text-muted-foreground"
								onClick={() =>
									patchSettings({ sorts: sorts.filter((_, position) => position !== index) })
								}
							>
								<X />
							</Button>
						</div>
					))}

					<Button
						variant="ghost"
						size="sm"
						className="justify-start gap-1.5 text-muted-foreground"
						onClick={addSort}
						disabled={sorts.length >= SORT_FIELDS.length}
					>
						<Plus />
						<span>Add sort</span>
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
