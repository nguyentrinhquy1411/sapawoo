import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Layers, Settings, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

const NAV_ITEMS = [
	{ to: "/", label: "Dashboard", icon: LayoutDashboard },
	{ to: "/boards", label: "Boards", icon: Layers },
	{ to: "/assistance", label: "ORIN", icon: Sparkles },
	{ to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
	const site = useAppStore((state) => state.site);
	const boards = useAppStore((state) => state.boards);
	const toggleStar = useAppStore((state) => state.toggleStar);
	const { pathname } = useLocation();

	const starred = boards.filter((board) => board.starred);

	return (
		<aside className="flex w-64 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3">
			<div className="flex items-center gap-2 px-1 py-1">
				<span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
					{site.icon}
				</span>
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-sm font-semibold text-foreground">{site.name}</span>
					<span className="truncate text-xs text-sidebar-foreground">{site.subdomain}.sapawoo.com</span>
				</div>
			</div>

			<nav className="flex flex-col gap-0.5">
				{NAV_ITEMS.map((item) => {
					const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
					return (
						<Button
							key={item.to}
							asChild
							variant="ghost"
							className={cn(
								"justify-start gap-2 text-sidebar-foreground",
								active && "bg-sidebar-accent text-sidebar-accent-foreground",
							)}
						>
							<Link to={item.to}>
								<item.icon />
								<span>{item.label}</span>
							</Link>
						</Button>
					);
				})}
			</nav>

			{starred.length > 0 && (
				<>
					<Separator />
					<div className="flex flex-col gap-1">
						<span className="px-3 text-xs font-medium uppercase tracking-wide text-sidebar-foreground">
							Starred
						</span>
						{starred.map((board) => (
							<Button
								key={board.id}
								asChild
								variant="ghost"
								size="sm"
								className="justify-start gap-2 text-sidebar-foreground"
							>
								<Link to="/boards/$boardKey" params={{ boardKey: board.key }}>
									<span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: board.color }} />
									<span className="truncate">{board.name}</span>
								</Link>
							</Button>
						))}
					</div>
				</>
			)}

			<Separator />

			<div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
				<span className="px-3 text-xs font-medium uppercase tracking-wide text-sidebar-foreground">
					All boards
				</span>
				{boards.map((board) => (
					<div key={board.id} className="flex items-center gap-1">
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="min-w-0 flex-1 justify-start gap-2 text-sidebar-foreground"
						>
							<Link to="/boards/$boardKey" params={{ boardKey: board.key }}>
								<span className="font-mono text-xs">{board.key}</span>
								<span className="truncate">{board.name}</span>
							</Link>
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => toggleStar(board.id)}
							className={cn("shrink-0", board.starred ? "text-primary" : "text-muted-foreground")}
						>
							<Star className={cn(board.starred && "fill-current")} />
						</Button>
					</div>
				))}
			</div>
		</aside>
	);
}
