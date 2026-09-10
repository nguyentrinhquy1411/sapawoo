import { Check } from "lucide-react";
import { AssigneeGroup } from "@/components/task/assignee-avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { initialsOf } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import type { Task } from "@/types";

export function AssigneePicker({ task }: { task: Task }) {
	const users = useAppStore((state) => state.users);
	const setAssignees = useAppStore((state) => state.setAssignees);

	const toggle = (userId: string) =>
		setAssignees(
			task.id,
			task.assigneeIds.includes(userId)
				? task.assigneeIds.filter((id) => id !== userId)
				: [...task.assigneeIds, userId],
		);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className="h-7 justify-start px-1">
					<AssigneeGroup users={users.filter((user) => task.assigneeIds.includes(user.id))} />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-52">
				<div className="flex flex-col">
					{users.map((user) => (
						<Button
							key={user.id}
							variant="ghost"
							size="sm"
							className="justify-start gap-2 font-normal"
							onClick={() => toggle(user.id)}
						>
							<span
								className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-card"
								style={{ backgroundColor: user.avatarColor }}
							>
								{initialsOf(user)}
							</span>
							<span className="flex-1 truncate text-left">{user.displayName}</span>
							{task.assigneeIds.includes(user.id) && <Check className="size-3.5 text-primary" />}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
}
