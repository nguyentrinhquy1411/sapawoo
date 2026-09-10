import { LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BoardContext } from "@/lib/ai/context";

export function BoardContextBar({ context }: { context: BoardContext | null }) {
	return (
		<div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5">
			<LayoutGrid className="size-3.5 text-muted-foreground" />
			{context ? (
				<>
					<span className="text-xs text-muted-foreground">Context</span>
					<Badge variant="outline" className="bg-card font-mono">
						{context.board.key}
					</Badge>
					<span className="truncate text-xs font-medium">{context.board.name}</span>
					<Badge variant="muted">{context.tasks.length} tasks</Badge>
				</>
			) : (
				<span className="text-xs text-muted-foreground">No board in context</span>
			)}
		</div>
	);
}
