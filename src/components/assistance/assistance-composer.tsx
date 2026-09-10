import { ArrowUp, CornerDownLeft, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BoardContext } from "@/lib/ai/context";

const MAX_HEIGHT = 160;

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

	useEffect(() => {
		const element = ref.current;
		if (!element) return;
		element.style.height = "auto";
		element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
	}, []);

	const resize = (element: HTMLTextAreaElement) => {
		element.style.height = "auto";
		element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
	};

	const submit = () => {
		const prompt = draft.trim();
		if (!prompt || isStreaming) return;
		setDraft("");
		onSend(prompt);
		if (ref.current) {
			ref.current.style.height = "auto";
		}
	};

	return (
		<div className="shrink-0 border-t border-border bg-card px-3 pb-3 pt-2">
			<div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
				<textarea
					ref={ref}
					rows={1}
					value={draft}
					placeholder={context ? `Ask about ${context.board.name}…` : "Ask about your work…"}
					className="max-h-40 w-full resize-none bg-transparent px-1 text-sm leading-6 outline-none placeholder:text-muted-foreground"
					onChange={(event) => {
						setDraft(event.target.value);
						resize(event.target);
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							submit();
						}
					}}
				/>

				<div className="flex items-center gap-2">
					<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
						<CornerDownLeft className="size-3" />
						<span>Enter to send · Shift+Enter for a new line</span>
					</span>

					{isStreaming ? (
						<Button size="sm" variant="secondary" className="ml-auto gap-1.5" onClick={onStop}>
							<Square className="size-3" />
							<span>Stop</span>
						</Button>
					) : (
						<Button
							size="icon-sm"
							className="ml-auto size-8 rounded-lg"
							disabled={!draft.trim()}
							onClick={submit}
						>
							<ArrowUp />
						</Button>
					)}
				</div>
			</div>

			<span className="mt-1.5 block text-center text-[10px] text-muted-foreground">
				Sapa can be wrong — review changes before applying them.
			</span>
		</div>
	);
}
