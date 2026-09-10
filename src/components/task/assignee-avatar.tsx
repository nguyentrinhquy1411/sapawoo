import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/store/selectors";
import type { User } from "@/types";

export function AssigneeAvatar({ user, className }: { user: User; className?: string }) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Avatar className={cn("border border-card", className)}>
					<AvatarFallback style={{ backgroundColor: user.avatarColor, color: "var(--color-card)" }}>
						{initialsOf(user)}
					</AvatarFallback>
				</Avatar>
			</TooltipTrigger>
			<TooltipContent>{user.displayName}</TooltipContent>
		</Tooltip>
	);
}

export function AssigneeGroup({ users, className }: { users: User[]; className?: string }) {
	if (users.length === 0) {
		return (
			<Avatar className={cn("border border-dashed border-border", className)}>
				<AvatarFallback className="bg-transparent text-muted-foreground">?</AvatarFallback>
			</Avatar>
		);
	}

	return (
		<div className={cn("flex -space-x-2", className)}>
			{users.map((user) => (
				<AssigneeAvatar key={user.id} user={user} />
			))}
		</div>
	);
}
