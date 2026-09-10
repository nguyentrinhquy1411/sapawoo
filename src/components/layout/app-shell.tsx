import { Outlet } from "@tanstack/react-router";
import { AssistanceSurface } from "@/components/assistance/assistance-surface";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TaskDetailDialog } from "@/components/task/task-detail-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell() {
	return (
		<TooltipProvider delayDuration={200}>
			<div className="flex h-screen overflow-hidden bg-background">
				<AppSidebar />
				<div className="flex min-w-0 flex-1 flex-col">
					<Outlet />
				</div>
				<AssistanceSurface />
			</div>
			<TaskDetailDialog />
		</TooltipProvider>
	);
}
