import { CircleAlert, User } from "lucide-react";
import type { BoardContext } from "@/lib/ai/context";
import { AssistanceConfirmationCard } from "@/components/assistance/assistance-confirmation-card";
import { MarkdownLite } from "@/components/assistance/markdown-lite";
import { SapaLogo } from "@/components/assistance/assistant-logo";
import { cn } from "@/lib/utils";
import { type AssistantMessage, useAssistantStore } from "@/store/use-assistant-store";

export function AssistanceMessageItem({
	message,
	threadId,
	context,
	streaming,
}: {
	message: AssistantMessage;
	threadId: string;
	context: BoardContext | null;
	streaming: boolean;
}) {
	const updateMessage = useAssistantStore((state) => state.updateMessage);
	const isUser = message.role === "user";

	return (
		<div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
			<span
				className={cn(
					"mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
					isUser ? "bg-secondary text-secondary-foreground" : "bg-ai-gradient text-primary-foreground",
				)}
			>
				{isUser ? <User className="size-3.5" /> : <SapaLogo className="size-3.5" />}
			</span>

			<div className={cn("flex min-w-0 flex-col gap-2", isUser ? "items-end" : "items-start", "flex-1")}>
				<div
					className={cn(
						"max-w-full rounded-xl px-3 py-2",
						isUser ? "bg-primary text-primary-foreground" : "bg-secondary/60",
					)}
				>
					{message.error ? (
						<span className="flex items-start gap-2 text-xs text-destructive">
							<CircleAlert className="mt-0.5 size-3.5 shrink-0" />
							<span>{message.error}</span>
						</span>
					) : (
						<>
							<MarkdownLite content={message.content} />
							{streaming && message.content.length === 0 && (
								<span className="flex gap-1 py-1">
									{[0, 1, 2].map((dot) => (
										<span
											key={dot}
											className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
											style={{ animationDelay: `${dot * 120}ms` }}
										/>
									))}
								</span>
							)}
						</>
					)}
				</div>

				{message.actions && message.actions.length > 0 && (
					<AssistanceConfirmationCard
						actions={message.actions}
						context={context}
						appliedCount={message.appliedCount}
						onApplied={(count) => updateMessage(threadId, message.id, { appliedCount: count })}
					/>
				)}
			</div>
		</div>
	);
}
