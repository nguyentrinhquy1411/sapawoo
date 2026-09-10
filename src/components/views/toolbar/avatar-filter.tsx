import { UserX } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import { UNASSIGNED } from "@/types";
import type { ViewSettingsController } from "@/store/use-view-settings";

export function AvatarFilter({ controller }: { controller: ViewSettingsController }) {
	const users = useAppStore((state) => state.users);
	const selected = controller.settings.filters.assigneeIds;

	return (
		<div className="flex items-center -space-x-1.5">
			{users.map((user) => {
				const active = selected.includes(user.id);
				return (
					<Tooltip key={user.id}>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								className={cn(
									"size-7 rounded-full p-0 transition-transform hover:z-10 hover:-translate-y-0.5",
									active && "z-10 ring-2 ring-primary ring-offset-1 ring-offset-card",
								)}
								onClick={() => controller.toggleInFilter("assigneeIds", user.id)}
							>
								<Avatar className="size-7 border border-card">
									<AvatarFallback
										style={{ backgroundColor: user.avatarColor, color: "var(--color-card)" }}
									>
										{initialsOf(user)}
									</AvatarFallback>
								</Avatar>
							</Button>
						</TooltipTrigger>
						<TooltipContent>{user.displayName}</TooltipContent>
					</Tooltip>
				);
			})}

			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						className={cn(
							"size-7 rounded-full border border-dashed border-border bg-card text-muted-foreground hover:z-10",
							selected.includes(UNASSIGNED) && "z-10 border-solid ring-2 ring-primary ring-offset-1 ring-offset-card",
						)}
						onClick={() => controller.toggleInFilter("assigneeIds", UNASSIGNED)}
					>
						<UserX className="size-3.5" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Unassigned</TooltipContent>
			</Tooltip>
		</div>
	);
}
