import dayjs from "dayjs";
import { CircleCheck, CircleDot, ListTodo, TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TopBar } from "@/components/layout/top-bar";
import { AssigneeGroup } from "@/components/task/assignee-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isOverdue, taskKey, useDoneStatusIds } from "@/store/selectors";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";

function StatCard({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string;
	value: number;
	icon: typeof ListTodo;
	tone?: "default" | "destructive";
}) {
	return (
		<Card>
			<CardContent className="flex items-center gap-4 p-5">
				<span
					className={cn(
						"flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground",
						tone === "destructive" && "bg-destructive/10 text-destructive",
					)}
				>
					<Icon className="size-5" />
				</span>
				<div className="flex flex-col">
					<span className="text-2xl font-semibold">{value}</span>
					<span className="text-xs text-muted-foreground">{label}</span>
				</div>
			</CardContent>
		</Card>
	);
}

export function DashboardPage() {
	const tasks = useAppStore((state) => state.tasks);
	const statuses = useAppStore((state) => state.statuses);
	const users = useAppStore((state) => state.users);
	const boards = useAppStore((state) => state.boards);
	const openTask = useUiStore((state) => state.openTask);

	const doneStatusIds = useDoneStatusIds();
	const inProgressStatusIds = useMemo(
		() => new Set(statuses.filter((status) => status.statusCategory === "in_progress").map((s) => s.id)),
		[statuses],
	);

	const doneCount = tasks.filter((task) => doneStatusIds.has(task.statusId)).length;
	const inProgressCount = tasks.filter((task) => inProgressStatusIds.has(task.statusId)).length;
	const overdueTasks = tasks.filter((task) => isOverdue(task, doneStatusIds));

	const byStatusName = useMemo(() => {
		const counts = new Map<string, { name: string; color: string; value: number }>();
		for (const task of tasks) {
			const status = statuses.find((item) => item.id === task.statusId);
			if (!status) continue;
			const entry = counts.get(status.name) ?? { name: status.name, color: status.color, value: 0 };
			entry.value += 1;
			counts.set(status.name, entry);
		}
		return [...counts.values()];
	}, [tasks, statuses]);

	const byAssignee = useMemo(
		() =>
			users.map((user) => ({
				name: user.displayName.split(" ")[0],
				value: tasks.filter(
					(task) => task.assigneeIds.includes(user.id) && !doneStatusIds.has(task.statusId),
				).length,
			})),
		[users, tasks, doneStatusIds],
	);

	const dueSoon = useMemo(
		() =>
			tasks
				.filter((task) => task.endDate && !doneStatusIds.has(task.statusId))
				.sort((a, b) => (a.endDate ?? "").localeCompare(b.endDate ?? ""))
				.slice(0, 6),
		[tasks, doneStatusIds],
	);

	return (
		<>
			<TopBar title="Dashboard" subtitle={`${boards.length} boards · ${tasks.length} tasks`} />

			<div className="flex-1 overflow-y-auto p-6">
				<div className="grid gap-4 md:grid-cols-4">
					<StatCard label="Total tasks" value={tasks.length} icon={ListTodo} />
					<StatCard label="In progress" value={inProgressCount} icon={CircleDot} />
					<StatCard label="Done" value={doneCount} icon={CircleCheck} />
					<StatCard
						label="Overdue"
						value={overdueTasks.length}
						icon={TriangleAlert}
						tone="destructive"
					/>
				</div>

				<div className="mt-4 grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Tasks by status</CardTitle>
						</CardHeader>
						<CardContent className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={byStatusName} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
										{byStatusName.map((entry) => (
											<Cell key={entry.name} fill={entry.color} />
										))}
									</Pie>
									<Tooltip
										contentStyle={{
											background: "var(--color-popover)",
											border: "1px solid var(--color-border)",
											borderRadius: "var(--radius-md)",
											fontSize: 12,
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
							<div className="flex flex-wrap gap-3">
								{byStatusName.map((entry) => (
									<span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
										<span>
											{entry.name} ({entry.value})
										</span>
									</span>
								))}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Open tasks per assignee</CardTitle>
						</CardHeader>
						<CardContent className="h-64">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={byAssignee}>
									<XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
									<YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={24} />
									<Tooltip
										cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
										contentStyle={{
											background: "var(--color-popover)",
											border: "1px solid var(--color-border)",
											borderRadius: "var(--radius-md)",
											fontSize: 12,
										}}
									/>
									<Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</div>

				<Card className="mt-4">
					<CardHeader>
						<CardTitle>Due soon</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-1">
						{dueSoon.length === 0 && (
							<p className="text-sm text-muted-foreground">
								<span>Nothing scheduled.</span>
							</p>
						)}
						{dueSoon.map((task) => {
							const assignees = users.filter((user) => task.assigneeIds.includes(user.id));
							const overdue = isOverdue(task, doneStatusIds);
							return (
								<Button
									key={task.id}
									variant="ghost"
									className="h-auto justify-start gap-3 px-2 py-2"
									onClick={() => openTask(task.id)}
								>
									<Badge variant="outline" className="font-mono">
										{taskKey(task)}
									</Badge>
									<span className="flex-1 truncate text-left font-normal">{task.summary}</span>
									<AssigneeGroup users={assignees} />
									<span
										className={cn(
											"w-24 text-right text-xs",
											overdue ? "font-medium text-destructive" : "text-muted-foreground",
										)}
									>
										{dayjs(task.endDate).format("MMM D, YYYY")}
									</span>
								</Button>
							);
						})}
					</CardContent>
				</Card>
			</div>
		</>
	);
}
