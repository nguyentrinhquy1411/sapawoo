import { X } from "lucide-react";
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { AssistanceThread } from "@/components/assistance/assistance-thread";
import { OrinLogo } from "@/components/assistance/orin-logo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAssistantStore } from "@/store/use-assistant-store";

export function AssistanceLauncher() {
	const mode = useAssistantStore((state) => state.mode);
	const modalOpen = useAssistantStore((state) => state.modalOpen);
	const sidebarOpen = useAssistantStore((state) => state.sidebarOpen);
	const setModalOpen = useAssistantStore((state) => state.setModalOpen);
	const setSidebarOpen = useAssistantStore((state) => state.setSidebarOpen);

	const open = mode === "modal" ? modalOpen : sidebarOpen;
	const toggle = () => (mode === "modal" ? setModalOpen(!modalOpen) : setSidebarOpen(!sidebarOpen));

	return (
		<div className="group fixed bottom-6 right-6 z-40 size-12">
			<div className="pointer-events-none absolute -inset-1.5 rounded-full bg-ai-gradient opacity-0 blur-md transition-opacity duration-300 group-hover:animate-ai-shimmer group-hover:opacity-70" />
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						className="relative size-12 rounded-full p-0 shadow-lg transition-transform active:scale-95"
						onClick={toggle}
					>
						{open ? (
							<X className="size-5 text-primary" />
						) : (
							<OrinLogo className="size-6 text-primary" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="left">{open ? "Close ORIN" : "Ask ORIN"}</TooltipContent>
			</Tooltip>
		</div>
	);
}

export function AssistanceSurface() {
	const mode = useAssistantStore((state) => state.mode);
	const modalOpen = useAssistantStore((state) => state.modalOpen);
	const sidebarOpen = useAssistantStore((state) => state.sidebarOpen);
	const setModalOpen = useAssistantStore((state) => state.setModalOpen);
	const setSidebarOpen = useAssistantStore((state) => state.setSidebarOpen);
	const threads = useAssistantStore((state) => state.threads);
	const newThread = useAssistantStore((state) => state.newThread);
	const activeThreadId = useAssistantStore((state) => state.activeThreadId);

	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const isFullscreenRoute = pathname === "/assistance";

	useEffect(() => {
		if (!activeThreadId && threads.length === 0) newThread();
	}, [activeThreadId, threads.length, newThread]);

	if (isFullscreenRoute) return null;

	return (
		<>
			{mode === "sidebar" && sidebarOpen && (
				<aside className="flex w-96 shrink-0 flex-col border-l border-border bg-card">
					<AssistanceThread onClose={() => setSidebarOpen(false)} />
				</aside>
			)}

			{mode === "modal" && modalOpen && (
				<div
					className={cn(
						"fixed bottom-24 right-6 z-40 h-[560px] w-[400px] max-w-[90vw] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl",
					)}
				>
					<AssistanceThread onClose={() => setModalOpen(false)} />
				</div>
			)}

			<AssistanceLauncher />
		</>
	);
}
