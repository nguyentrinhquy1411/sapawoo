import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
	value,
	onChange,
	placeholder = "Search tasks…",
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}) {
	const [draft, setDraft] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setDraft(value);
	}, [value]);

	useEffect(() => {
		const timer = setTimeout(() => {
			if (draft !== value) onChange(draft);
		}, 200);
		return () => clearTimeout(timer);
	}, [draft, value, onChange]);

	useEffect(() => {
		const focusOnSlash = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const typingElsewhere =
				target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
			if (event.key === "/" && !typingElsewhere) {
				event.preventDefault();
				inputRef.current?.focus();
			}
		};
		window.addEventListener("keydown", focusOnSlash);
		return () => window.removeEventListener("keydown", focusOnSlash);
	}, []);

	return (
		<div className={cn("relative w-56", className)}>
			<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				ref={inputRef}
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onKeyDown={(event) => event.key === "Escape" && setDraft("")}
				placeholder={placeholder}
				className="h-8 pl-9 pr-8"
			/>
			{draft ? (
				<Button
					variant="ghost"
					size="icon-sm"
					className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
					onClick={() => setDraft("")}
				>
					<X />
				</Button>
			) : (
				<span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border px-1 text-[10px] text-muted-foreground">
					/
				</span>
			)}
		</div>
	);
}
