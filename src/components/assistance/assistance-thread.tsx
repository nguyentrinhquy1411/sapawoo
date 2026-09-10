import {
	ClipboardList,
	History,
	Maximize2,
	MessageSquarePlus,
	PanelRight,
	ShieldAlert,
	Sparkles,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AssistanceComposer } from "@/components/assistance/assistance-composer";
import { AssistanceHistory } from "@/components/assistance/assistance-sidebar";
import { AssistanceMessageItem } from "@/components/assistance/assistance-message";
import { BoardContextBar } from "@/components/assistance/board-context-bar";
import { OrinLogo } from "@/components/assistance/orin-logo";
import { useCurrentBoardContext } from "@/components/assistance/use-board-context";
import { useOrin } from "@/components/assistance/use-orin";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isAiConfigured } from "@/lib/ai/groq";
import { cn } from "@/lib/utils";
import { useAssistantStore } from "@/store/use-assistant-store";

const SUGGESTIONS = [
	{
		icon: ShieldAlert,
		label: "Find blockers, overdue work and ownership gaps",
		prompt:
			"Analyze this board for delivery risks: overdue work, unassigned tasks and anything stuck in review. Prioritise the top issues and suggest next actions.",
	},
	{
		icon: ClipboardList,
		label: "Draft a status update for this board",
		prompt:
			"Draft a concise status update for this board: progress, risks, decisions needed and recommended next steps.",
	},
	{
		icon: Sparkles,
		label: "Plan the next sprint from what is here",
		prompt:
			"Help plan the next sprint from the current backlog. Group work by outcome, flag dependencies and propose a realistic sequence.",
	},
];

interface AssistanceThreadProps {
	showHistory?: boolean;
	onClose?: () => void;
	className?: string;
	fullscreen?: boolean;
}

export function AssistanceThread({ showHistory = false, onClose, className, fullscreen }: AssistanceThreadProps) {
	const context = useCurrentBoardContext();
	const { send, stop, isStreaming } = useOrin(context);
	const threads = useAssistantStore((state) => state.threads);
	const activeThreadId = useAssistantStore((state) => state.activeThreadId);
	const streamingMessageId = useAssistantStore((state) => state.streamingMessageId);
	const newThread = useAssistantStore((state) => state.newThread);
	const setMode = useAssistantStore((state) => state.setMode);
	const mode = useAssistantStore((state) => state.mode);
	const [historyOpen, setHistoryOpen] = useState(false);

	const thread = threads.find((item) => item.id === activeThreadId);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [thread?.messages.length, streamingMessageId]);

	return (
		<div className={cn("flex h-full min-h-0 w-full bg-background", className)}>
			{showHistory && (
				<div className="hidden w-56 shrink-0 border-r border-border md:block">
					<AssistanceHistory />
				</div>
			)}

			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
					<span className="flex size-7 items-center justify-center rounded-lg bg-ai-gradient text-primary-foreground">
						<OrinLogo className="size-4" />
					</span>
					<span className="text-sm font-semibold">ORIN</span>

					<div className="ml-auto flex items-center gap-0.5">
						{!showHistory && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => setHistoryOpen((value) => !value)}
									>
										<History />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Chat history</TooltipContent>
							</Tooltip>
						)}

						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon-sm" onClick={() => newThread()}>
									<MessageSquarePlus />
								</Button>
							</TooltipTrigger>
							<TooltipContent>New chat</TooltipContent>
						</Tooltip>

						{!fullscreen && (
							<>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => setMode(mode === "modal" ? "sidebar" : "modal")}
										>
											<PanelRight />
										</Button>
									</TooltipTrigger>
									<TooltipContent>{mode === "modal" ? "Dock to side" : "Float"}</TooltipContent>
								</Tooltip>

								<Tooltip>
									<TooltipTrigger asChild>
										<Button asChild variant="ghost" size="icon-sm">
											<Link to="/assistance" onClick={onClose}>
												<Maximize2 />
											</Link>
										</Button>
									</TooltipTrigger>
									<TooltipContent>Full screen</TooltipContent>
								</Tooltip>
							</>
						)}

						{onClose && (
							<Button variant="ghost" size="icon-sm" onClick={onClose}>
								<X />
							</Button>
						)}
					</div>
				</div>

				{historyOpen && !showHistory ? (
					<div className="min-h-0 flex-1 overflow-y-auto">
						<AssistanceHistory onSelect={() => setHistoryOpen(false)} />
					</div>
				) : (
					<>
						<BoardContextBar context={context} />

						<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
							{!thread || thread.messages.length === 0 ? (
								<div className="flex flex-1 flex-col justify-end gap-3">
									<div className="flex flex-col items-center gap-2 py-6 text-center">
										<span className="flex size-11 items-center justify-center rounded-2xl bg-ai-gradient animate-ai-shimmer text-primary-foreground">
											<OrinLogo className="size-6" />
										</span>
										<span className="text-sm font-semibold">How can I help?</span>
										<span className="max-w-xs text-xs text-muted-foreground">
											{context
												? `I can see ${context.tasks.length} tasks on ${context.board.name}.`
												: "Open a board and I can read its tasks."}
										</span>
									</div>

									{SUGGESTIONS.map((suggestion) => (
										<Button
											key={suggestion.label}
											variant="outline"
											className="h-auto justify-start gap-2 whitespace-normal py-2 text-left"
											onClick={() => send(suggestion.prompt)}
										>
											<suggestion.icon className="shrink-0 text-primary" />
											<span className="text-xs font-normal">{suggestion.label}</span>
										</Button>
									))}
								</div>
							) : (
								thread.messages.map((message) => (
									<AssistanceMessageItem
										key={message.id}
										message={message}
										threadId={thread.id}
										context={context}
										streaming={streamingMessageId === message.id}
									/>
								))
							)}
							<div ref={bottomRef} />
						</div>

						{!isAiConfigured() && (
							<span className="shrink-0 border-t border-border bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
								Set VITE_GROQ_API_KEY in .env.local to enable ORIN.
							</span>
						)}

						<AssistanceComposer
							context={context}
							isStreaming={isStreaming}
							onSend={send}
							onStop={stop}
						/>
					</>
				)}
			</div>
		</div>
	);
}
