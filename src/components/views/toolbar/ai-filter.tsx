import { ArrowUp, CircleAlert, LoaderCircle, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAiConfigured } from "@/components/assistance/use-ai-configured";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { runFilterAgent } from "@/lib/ai/filter-agent";
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
	const aiReady = useAiConfigured();

	const examples = useMemo(() => {
		const member = users[1]?.displayName.split(" ").slice(-1)[0] ?? "me";
		const doneStatus = statuses.find((status) => status.statusCategory === "done")?.name ?? "Done";
		return [
			`Overdue work assigned to ${member}`,
			`High priority tasks that are not ${doneStatus}`,
			"Everything due this week with no assignee",
		];
	}, [users, statuses]);

	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);

	const run = async (prompt: string) => {
		const trimmed = prompt.trim();
		if (!trimmed || loading) return;

		setLoading(true);
		setError(null);
		try {
			const result = await runFilterAgent(trimmed, { statuses, priorities, users });
			controller.patchFilters(result.filters);
			setExplanation(result.explanation || trimmed);
			setQuery("");
			setOpen(false);
		} catch (issue) {
			setError((issue as Error).message);
		} finally {
			setLoading(false);
		}
	};

	if (!aiReady) return null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn("gap-1.5", explanation ? "text-primary" : "text-muted-foreground")}
				>
					<Sparkles />
					<span>AI filter</span>
				</Button>
			</PopoverTrigger>

			<PopoverContent align="end" className="w-80 p-0">
				<div className="flex items-center gap-2 px-3 py-2.5">
					<span className="flex size-6 items-center justify-center rounded-md bg-ai-gradient text-primary-foreground">
						<Sparkles className="size-3.5" />
					</span>
					<div className="flex flex-col">
						<span className="text-sm font-semibold">Filter with AI</span>
						<span className="text-[11px] text-muted-foreground">
							Describe what you want to see on this board
						</span>
					</div>
				</div>

				<Separator />

				<div className="p-3">
					<div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
						<input
							ref={inputRef}
							value={query}
							placeholder="Overdue tasks with no assignee…"
							className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
							onChange={(event) => setQuery(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") run(query);
								if (event.key === "Escape") setOpen(false);
							}}
						/>
						<Button
							size="icon-sm"
							className="size-7 shrink-0 rounded-md"
							disabled={!query.trim() || loading}
							onClick={() => run(query)}
						>
							{loading ? <LoaderCircle className="animate-spin" /> : <ArrowUp />}
						</Button>
					</div>

					{error && (
						<span className="mt-2 flex items-start gap-1.5 text-[11px] text-destructive">
							<CircleAlert className="mt-px size-3 shrink-0" />
							<span>{error}</span>
						</span>
					)}

					<div className="mt-3 flex flex-col gap-1">
						<span className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
							Try
						</span>
						{examples.map((example) => (
							<Button
								key={example}
								variant="ghost"
								size="sm"
								className="h-auto justify-start whitespace-normal px-2 py-1.5 text-left text-xs font-normal text-muted-foreground hover:text-foreground"
								disabled={loading}
								onClick={() => run(example)}
							>
								<span>{example}</span>
							</Button>
						))}
					</div>

					{explanation && (
						<>
							<Separator className="my-3" />
							<div className="flex items-start gap-2">
								<Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
								<span className="flex-1 text-[11px] text-muted-foreground">{explanation}</span>
								<Button
									variant="ghost"
									size="icon-sm"
									className="size-5 shrink-0 text-muted-foreground"
									onClick={() => {
										controller.resetFilters();
										setExplanation(null);
									}}
								>
									<X className="size-3" />
								</Button>
							</div>
						</>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
