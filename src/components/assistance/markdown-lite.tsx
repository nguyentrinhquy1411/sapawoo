import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g;

function renderInline(text: string): ReactNode[] {
	return text.split(INLINE).map((part, index) => {
		const key = `${index}-${part}`;
		if (part.startsWith("**") && part.endsWith("**")) {
			return (
				<strong key={key} className="font-semibold">
					{part.slice(2, -2)}
				</strong>
			);
		}
		if (part.startsWith("`") && part.endsWith("`")) {
			return (
				<code key={key} className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px]">
					{part.slice(1, -1)}
				</code>
			);
		}
		return <span key={key}>{part}</span>;
	});
}

export function MarkdownLite({ content, className }: { content: string; className?: string }) {
	const blocks = content.split("\n").filter((line) => line.trim().length > 0);

	return (
		<div className={cn("flex flex-col gap-1.5 text-sm leading-relaxed", className)}>
			{blocks.map((line, index) => {
				const key = `${index}-${line.slice(0, 12)}`;
				const trimmed = line.trim();

				if (/^#{1,4}\s/.test(trimmed)) {
					return (
						<span key={key} className="mt-1 text-sm font-semibold">
							{renderInline(trimmed.replace(/^#{1,4}\s/, ""))}
						</span>
					);
				}

				if (/^[-*]\s/.test(trimmed)) {
					return (
						<span key={key} className="flex gap-2 pl-1">
							<span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
							<span>{renderInline(trimmed.slice(2))}</span>
						</span>
					);
				}

				const numbered = trimmed.match(/^(\d+)\.\s(.*)$/);
				if (numbered) {
					return (
						<span key={key} className="flex gap-2 pl-1">
							<span className="font-mono text-xs text-muted-foreground">{numbered[1]}.</span>
							<span>{renderInline(numbered[2])}</span>
						</span>
					);
				}

				return <span key={key}>{renderInline(trimmed)}</span>;
			})}
		</div>
	);
}
