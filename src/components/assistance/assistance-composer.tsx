import { ArrowUp, Square } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { BoardContext } from "@/lib/ai/context";
import { cn } from "@/lib/utils";

export function AssistanceComposer({
	context,
	isStreaming,
	onSend,
	onStop,
}: {
	context: BoardContext | null;
	isStreaming: boolean;
	onSend: (prompt: string) => void;
	onStop: () => void;
}) {
	const [draft, setDraft] = useState("");
	const ref = useRef<HTMLTextAreaElement>(null);

	const submit = () => {
		const prompt = draft.trim();
		if (!prompt || isStreaming) return;
		setDraft("");
		onSend(prompt);
	};

	return (
		<div className="shrink-0 border-t border-border bg-card p-3">
			<div className="rounded-xl bg-ai-gradient p-px">
				<div className="flex items-end gap-2 rounded-[11px] bg-card p-2">
					<Textarea
						ref={ref}
						value={draft}
						placeholder={
							context ? `Ask about ${context.board.name}…` : "Ask about your work…"
						}
						className="min-h-9 flex-1 resize-none border-0 p-1 text-sm shadow-none focus-visible:ring-0"
						onChange={(event) => setDraft(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								submit();
							}
						}}
					/>
					{isStreaming ? (
						<Button size="icon-sm" variant="secondary" className="size-8" onClick={onStop}>
							<Square className="size-3.5" />
						</Button>
					) : (
						<Button size="icon-sm" className={cn("size-8")} disabled={!draft.trim()} onClick={submit}>
							<ArrowUp />
						</Button>
					)}
				</div>
			</div>
			<span className="mt-1.5 block text-[10px] text-muted-foreground">
				ORIN can be wrong — review changes before applying them.
			</span>
		</div>
	);
}
