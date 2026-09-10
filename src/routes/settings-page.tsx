import { Download, Moon, RotateCcw, Sun } from "lucide-react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { useUiStore } from "@/store/use-ui-store";

export function SettingsPage() {
	const site = useAppStore((state) => state.site);
	const users = useAppStore((state) => state.users);
	const boards = useAppStore((state) => state.boards);
	const tasks = useAppStore((state) => state.tasks);
	const updateSite = useAppStore((state) => state.updateSite);
	const resetToSeed = useAppStore((state) => state.resetToSeed);
	const theme = useUiStore((state) => state.theme);
	const setTheme = useUiStore((state) => state.setTheme);

	const exportData = () => {
		const state = useAppStore.getState();
		const payload = {
			site: state.site,
			users: state.users,
			boards: state.boards,
			statuses: state.statuses,
			priorities: state.priorities,
			views: state.views,
			tasks: state.tasks,
			comments: state.comments,
		};
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `${site.subdomain}-export.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};

	return (
		<>
			<TopBar title="Settings" subtitle="Workspace, appearance and demo data" />

			<div className="flex-1 overflow-y-auto p-6">
				<div className="mx-auto flex max-w-3xl flex-col gap-4">
					<Card>
						<CardHeader>
							<CardTitle>Workspace</CardTitle>
							<CardDescription>How this site is identified across the app.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-[100px_1fr_1fr]">
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="site-icon">Icon</Label>
								<Input
									id="site-icon"
									value={site.icon}
									maxLength={2}
									onChange={(event) => updateSite({ icon: event.target.value.toUpperCase() })}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="site-name">Name</Label>
								<Input
									id="site-name"
									value={site.name}
									onChange={(event) => updateSite({ name: event.target.value })}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="site-subdomain">Subdomain</Label>
								<Input
									id="site-subdomain"
									value={site.subdomain}
									onChange={(event) => updateSite({ subdomain: event.target.value.toLowerCase() })}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Appearance</CardTitle>
							<CardDescription>The theme is stored on this device.</CardDescription>
						</CardHeader>
						<CardContent className="flex gap-2">
							<Button
								variant="outline"
								className={cn("gap-2", theme === "light" && "border-primary text-primary")}
								onClick={() => setTheme("light")}
							>
								<Sun />
								<span>Light</span>
							</Button>
							<Button
								variant="outline"
								className={cn("gap-2", theme === "dark" && "border-primary text-primary")}
								onClick={() => setTheme("dark")}
							>
								<Moon />
								<span>Dark</span>
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Members</CardTitle>
							<CardDescription>
								Demo members used for assignees — there is no auth in this clone.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2">
							{users.map((user) => (
								<div key={user.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
									<span
										className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-card"
										style={{ backgroundColor: user.avatarColor }}
									>
										{user.displayName
											.split(" ")
											.map((part) => part[0])
											.slice(0, 2)
											.join("")}
									</span>
									<div className="flex flex-col">
										<span className="text-sm font-medium">{user.displayName}</span>
										<span className="text-xs text-muted-foreground">{user.email}</span>
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Data</CardTitle>
							<CardDescription>
								{boards.length} boards and {tasks.length} tasks are stored in this browser.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<div className="flex gap-2">
								<Button variant="outline" className="gap-2" onClick={exportData}>
									<Download />
									<span>Export JSON</span>
								</Button>
								<Button
									variant="outline"
									className="gap-2 text-destructive hover:bg-destructive/10"
									onClick={resetToSeed}
								>
									<RotateCcw />
									<span>Reset demo data</span>
								</Button>
							</div>
							<Separator />
							<p className="text-xs text-muted-foreground">
								<span>
									Resetting restores the seeded boards, tasks and view settings. It cannot be undone.
								</span>
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
