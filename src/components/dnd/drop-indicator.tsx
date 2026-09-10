import type { Edge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { cn } from "@/lib/utils";

export function DropIndicator({ edge, gap = "0.5rem" }: { edge: Edge; gap?: string }) {
	const vertical = edge === "top" || edge === "bottom";

	return (
		<div
			className={cn(
				"pointer-events-none absolute z-10 bg-primary",
				vertical ? "left-0 right-0 h-0.5" : "bottom-0 top-0 w-0.5",
				edge === "top" && "top-0",
				edge === "bottom" && "bottom-0",
				edge === "left" && "left-0",
				edge === "right" && "right-0",
			)}
			style={vertical ? { marginTop: edge === "bottom" ? gap : undefined } : undefined}
		>
			<span
				className={cn(
					"absolute size-1.5 rounded-full bg-primary",
					vertical ? "-left-1 -top-0.5" : "-left-0.5 -top-1",
				)}
			/>
		</div>
	);
}
