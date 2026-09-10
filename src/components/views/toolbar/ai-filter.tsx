import { ArrowRight, LoaderCircle, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { runFilterAgent } from "@/lib/ai/filter-agent";
import { isAiConfigured } from "@/lib/ai/groq";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import type { ViewSettingsController } from "@/store/use-view-settings";
import type { BoardStatus } from "@/types";

export function AiFilter({
	controller,
	statuses,
}: {
	controller: ViewSettingsController;
	statuses: BoardStatus[];
}) {
	const priorities = useAppStore((state) => state.priorities);
	const users = useAppStore((state) => state.users);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [explanation, setExplanation] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	const run = async () => {
		const prompt = query.trim();
		if (!prompt || loading) return;

		setLoading(true);
		setError(null);
		try {
			const result = await runFilterAgent(prompt, { statuses, priorities, users });
			controller.patchFilters(result.filters);
			setExplanation(result.explanation || prompt);
			setQuery("");
			setOpen(false);
		} catch (issue) {
			setError((issue as Error).message);
		} finally {
			setLoading(false);
		}
	};

	if (!isAiConfigured()) return null;

	return (
		<div className="flex items-center gap-1">
			{open ? (
				<div className="flex items-center gap-1 rounded-lg bg-ai-gradient p-px">
					<div className="flex items-center gap-1 rounded-[7px] bg-card px-1">
						<Sparkles className="size-3.5 text-primary" />
						<Input
							ref={inputRef}
							value={query}
							placeholder="Overdue tasks assigned to An…"
							className="h-7 w-60 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
							onChange={(event) => setQuery(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") run();
								if (event.key === "Escape") setOpen(false);
							}}
						/>
						<Button
							variant="ghost"
							size="icon-sm"
							className="size-6 text-primary"
							disabled={!query.trim() || loading}
							onClick={run}
						>
							{loading ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
						</Button>
						<Button variant="ghost" size="icon-sm" className="size-6" onClick={() => setOpen(false)}>
							<X />
						</Button>
					</div>
				</div>
			) : (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className={cn("gap-1.5 text-primary")}
							onClick={() => setOpen(true)}
						>
							<Sparkles />
							<span>AI filter</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Describe what you want to see</TooltipContent>
				</Tooltip>
			)}

			{error && <span className="max-w-40 truncate text-[11px] text-destructive">{error}</span>}
			{!error && explanation && !open && (
				<span className="max-w-48 truncate text-[11px] text-muted-foreground" title={explanation}>
					AI: {explanation}
				</span>
			)}
		</div>
	);
}
