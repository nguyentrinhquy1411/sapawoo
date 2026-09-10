import { Check, CircleAlert, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { type ProposedAction, applyActions, describeAction } from "@/lib/ai/actions";
import type { BoardContext } from "@/lib/ai/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";

const ICONS = {
	create_task: Plus,
	update_task: RefreshCw,
	delete_task: Trash2,
};

export function AssistanceConfirmationCard({
	actions,
	context,
	appliedCount,
	onApplied,
}: {
	actions: ProposedAction[];
	context: BoardContext | null;
	appliedCount?: number;
	onApplied: (count: number) => void;
}) {
	const createTask = useAppStore((state) => state.createTask);
	const updateTask = useAppStore((state) => state.updateTask);
	const deleteTask = useAppStore((state) => state.deleteTask);
	const [discarded, setDiscarded] = useState(false);

	if (discarded) return null;

	if (appliedCount !== undefined) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">
				<Check className="size-3.5 text-primary" />
				<span>Applied {appliedCount} of {actions.length} changes to the board.</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-card p-3 shadow-sm">
			<div className="flex items-center gap-2">
				<Badge variant="default">Proposed changes</Badge>
				<span className="text-xs text-muted-foreground">{actions.length} actions</span>
			</div>

			<div className="flex flex-col gap-1.5">
				{actions.map((action, index) => {
					const Icon = ICONS[action.type];
					const { title, detail } = describeAction(action);
					return (
						<div
							key={`${action.type}-${action.taskKey ?? action.summary ?? index}`}
							className="flex items-start gap-2 rounded-lg bg-secondary/60 px-2 py-1.5"
						>
							<Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
							<div className="flex min-w-0 flex-col">
								<span className="truncate text-xs font-medium">{title}</span>
								{detail && <span className="truncate text-[11px] text-muted-foreground">{detail}</span>}
							</div>
						</div>
					);
				})}
			</div>

			{!context && (
				<span className="flex items-center gap-1.5 text-[11px] text-destructive">
					<CircleAlert className="size-3" />
					<span>Open a board to apply these changes.</span>
				</span>
			)}

			<div className="flex gap-2">
				<Button
					size="sm"
					className="flex-1 gap-1.5"
					disabled={!context}
					onClick={() => {
						if (!context) return;
						const applied = applyActions(actions, context, { createTask, updateTask, deleteTask });
						onApplied(applied);
					}}
				>
					<Check />
					<span>Apply</span>
				</Button>
				<Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setDiscarded(true)}>
					<X />
					<span>Discard</span>
				</Button>
			</div>
		</div>
	);
}
