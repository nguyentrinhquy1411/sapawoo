import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAssistantStore } from "@/store/use-assistant-store";

export function AssistanceHistory({ onSelect }: { onSelect?: () => void }) {
	const threads = useAssistantStore((state) => state.threads);
	const activeThreadId = useAssistantStore((state) => state.activeThreadId);
	const selectThread = useAssistantStore((state) => state.selectThread);
	const deleteThread = useAssistantStore((state) => state.deleteThread);
	const newThread = useAssistantStore((state) => state.newThread);

	return (
		<div className="flex h-full flex-col gap-1 p-2">
			<Button
				variant="outline"
				size="sm"
				className="justify-start gap-2"
				onClick={() => {
					newThread();
					onSelect?.();
				}}
			>
				<MessageSquarePlus />
				<span>New chat</span>
			</Button>

			<div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
				{threads.length === 0 && (
					<span className="px-2 py-3 text-xs text-muted-foreground">No conversations yet.</span>
				)}
				{threads.map((thread) => (
					<div key={thread.id} className="group flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"min-w-0 flex-1 justify-start font-normal",
								thread.id === activeThreadId && "bg-accent text-accent-foreground",
							)}
							onClick={() => {
								selectThread(thread.id);
								onSelect?.();
							}}
						>
							<span className="truncate">{thread.title}</span>
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100"
							onClick={() => deleteThread(thread.id)}
						>
							<Trash2 />
						</Button>
					</div>
				))}
			</div>
		</div>
	);
}
