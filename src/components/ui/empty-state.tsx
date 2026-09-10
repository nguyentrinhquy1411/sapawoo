import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: {
	icon: LucideIcon;
	title: string;
	description?: string;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}>
			<span className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
				<Icon className="size-5" />
			</span>
			<span className="text-sm font-medium">{title}</span>
			{description && <span className="max-w-sm text-xs text-muted-foreground">{description}</span>}
			{action}
		</div>
	);
}
