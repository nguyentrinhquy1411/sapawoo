import { Link } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/use-ui-store";

export interface Breadcrumb {
	label: string;
	to?: string;
}

interface TopBarProps {
	title: string;
	subtitle?: string;
	breadcrumbs?: Breadcrumb[];
	actions?: ReactNode;
}

export function TopBar({ title, subtitle, breadcrumbs, actions }: TopBarProps) {
	const theme = useUiStore((state) => state.theme);
	const toggleTheme = useUiStore((state) => state.toggleTheme);

	return (
		<header className="flex shrink-0 items-center gap-4 border-b border-border bg-card px-6 py-3">
			<div className="flex min-w-0 flex-col">
				{breadcrumbs && breadcrumbs.length > 0 && (
					<nav className="flex items-center gap-1 text-xs text-muted-foreground">
						{breadcrumbs.map((crumb) => (
							<span key={crumb.label} className="flex items-center gap-1">
								{crumb.to ? (
									<Button asChild variant="link" className="h-auto p-0 text-xs text-muted-foreground">
										<Link to={crumb.to}>
											<span>{crumb.label}</span>
										</Link>
									</Button>
								) : (
									<span>{crumb.label}</span>
								)}
								<span>/</span>
							</span>
						))}
					</nav>
				)}
				<span className="truncate text-base font-semibold">{title}</span>
				{subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
			</div>

			<div className="ml-auto flex items-center gap-2">
				{actions}
				<Button variant="ghost" size="icon" onClick={toggleTheme}>
					{theme === "light" ? <Moon /> : <Sun />}
				</Button>
			</div>
		</header>
	);
}
