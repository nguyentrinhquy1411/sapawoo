import { ArrowDown, ArrowUp, ChevronsUp, Minus, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BoardPriority, PriorityKey } from "@/types";

const ICONS: Record<PriorityKey, typeof ArrowUp> = {
	urgent: ChevronsUp,
	high: ArrowUp,
	medium: Minus,
	low: ArrowDown,
	none: MoreHorizontal,
};

export function PriorityIcon({ priority, className }: { priority: BoardPriority; className?: string }) {
	const Icon = ICONS[priority.key];
	return <Icon className={cn("size-3.5 shrink-0", className)} style={{ color: priority.color }} />;
}

export function PriorityBadge({ priority }: { priority: BoardPriority }) {
	return (
		<Badge variant="muted" className="gap-1">
			<PriorityIcon priority={priority} />
			<span>{priority.name}</span>
		</Badge>
	);
}
