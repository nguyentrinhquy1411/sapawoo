import { cn } from "@/lib/utils";

export function SapaLogo({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={cn("size-5", className)} aria-hidden="true">
			<title>Sapa</title>
			<path
				d="M12 2.5c.5 3.2 2.3 5 5.5 5.5-3.2.5-5 2.3-5.5 5.5-.5-3.2-2.3-5-5.5-5.5 3.2-.5 5-2.3 5.5-5.5Z"
				fill="currentColor"
			/>
			<path
				d="M18 13.5c.3 1.7 1.2 2.6 2.9 2.9-1.7.3-2.6 1.2-2.9 2.9-.3-1.7-1.2-2.6-2.9-2.9 1.7-.3 2.6-1.2 2.9-2.9Z"
				fill="currentColor"
				opacity="0.75"
			/>
			<path
				d="M7 15c.2 1.2.9 1.9 2.1 2.1-1.2.2-1.9.9-2.1 2.1-.2-1.2-.9-1.9-2.1-2.1C6.1 16.9 6.8 16.2 7 15Z"
				fill="currentColor"
				opacity="0.5"
			/>
		</svg>
	);
}
